const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const {username} = request.headers;

  const user = users.find(user => user.username === username);

  if(!user){
    return response.status(400).json({
      error: 'Usuário não encontrado'
    });
  }

  request.user = user;

  return next();
}

app.post("/users", (request, response) => {
  const {name, username} = request.body;
  const id = uuidv4();

  const userAlredyExists = users.some(user=>user.username === username);

  if(userAlredyExists) return response.status(400).json({
    error: "O nome de usuário já está em uso"
  });

  const newUser = {
    id,
    name,
    username,
    todos: []
  }

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const todos = request.user.todos;

  return response.status(200).json(todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const {title, deadline} = request.body;
  const todoId = uuidv4();

  const newTodo = {
    id: todoId,
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  }

  request.user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const {title, deadline} = request.body;
  const {id} = request.params;

  const todo = request.user.todos.find(todo => todo.id === id);

  if(!todo) return response.status(404).json({
    error: 'A tarefa não foi encontrada'
  });

  if(title) todo.title = title;
  if(deadline) todo.deadline = deadline;

  return response.status(201).json(todo);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const {id} = request.params;

  const todo = request.user.todos.find(todo => todo.id === id);

  if(!todo) return response.status(404).json({
    error: 'A tarefa não foi encontrada'
  });

  todo.done = true;

  return response.status(201).json(todo);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const {id} = request.params;

  const todo = request.user.todos.find(todo => todo.id === id);

  if(!todo) return response.status(404).json({
    error: 'A tarefa não foi encontrada'
  });

  request.user.todos.splice(todo,1);

  return response.status(204).send();
});

module.exports = app;
