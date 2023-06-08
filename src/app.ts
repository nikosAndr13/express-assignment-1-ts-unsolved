import express from "express";
import { prisma } from "../prisma/prisma-instance";
import { errorHandleMiddleware } from "./error-handler";
import "express-async-errors";
// type Dog = {
//   id: number;
//   name: string;
//   description: string;
//   breed: string;
//   isFavorite: boolean;
// };

const app = express();
app.use(express.json());
// All code should go below this line
app.get("/", (_req, res) => {
  res.json({ message: "Hello World!" }).status(200);
});

app.get("/dogs", async (_req, res) => {
  const dogs = await prisma.dog.findMany()
  res.send(dogs)
});

app.get("/dogs/:id", async (req, res) => {
  const id: number = +req.params.id;
  if (isNaN(id)) {
    return res.status(400).json({ message: 'id should be a number' });
  }

  const dog = await prisma.dog.findUnique({
    where: {
      id,
    },
  });

  if (!dog) {
    return res.sendStatus(204);
  }

  res.send(dog);
})

app.delete("/dogs/:id", async (req, res) => {
  const id = +req.params.id;

  if (isNaN(id)) {
    return res.status(400).json({ message: 'id should be a number' });
  }

  const deleted = await Promise.resolve()
    .then(() => prisma.dog.delete({
      where: {
        id,
      },
    })
      .catch(() => null));

  if (deleted === null) {
    return res.sendStatus(204);
  }

  return res.send(deleted);
})

app.post('/dogs', async (req, res) => {
  const createData = req.body;
  const errors = [];
  const name = createData.name;
  const description = createData.description;
  const age = createData.age;
  const breed = createData.breed;

  if (!('name' in createData) || typeof createData.name !== 'string') {
    errors.push('name should be a string');
  }

  if (!('description' in createData) || typeof createData.description !== 'string') {
    errors.push('description should be a string');
  }

  if (!('age' in createData) || typeof createData.age !== 'number') {
    errors.push('age should be a number');
  }

  const allowedKeys = ['name', 'description', 'age', 'breed'];
  const invalidKeys = Object.keys(createData).filter(key => !allowedKeys.includes(key));
  if (invalidKeys.length > 0) {
    invalidKeys.forEach(key => {
      errors.push(`'${key}' is not a valid key`);
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const newDog = await prisma.dog.create({
      data: {
        name,
        breed,
        description,
        age
      }
    });
    return res.status(201).send(newDog);
  } catch (e) {
    console.error(e);
    return res.sendStatus(500);
  }
});

app.patch("/dogs/:id", async (req, res) => {
  try {
    const allowedKeys = ['name', 'description', 'breed', 'age'];

    const invalidKeys = Object.keys(req.body).filter(key => !allowedKeys.includes(key));
    if (invalidKeys.length > 0) {
      const errorMessages = invalidKeys.map(key => `'${key}' is not a valid key`);
      return res.status(400).json({ errors: errorMessages });
    }

    // Find the dog with the provided ID
    const dogToUpdate = await prisma.dog.findUnique({ where: { id: +req.params.id } });
    if (!dogToUpdate) {
      return res.status(404).json({ error: 'Dog not found' });
    }
    const updatedDog = await prisma.dog.update({
      where: {
        id: +req.params.id,
      },
      data: req.body,
    });
    res.status(201).json(updatedDog);
  } catch (error) { res.sendStatus(204) }
})


// all your code should go above this line
app.use(errorHandleMiddleware);

const port = process.env.NODE_ENV === "test" ? 3001 : 3000;
app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`)
);
