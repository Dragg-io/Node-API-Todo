const express = require("express");
const cors = require("cors");

const { v4: uuidv4, validate } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const {username} = request.headers;

  const user = users.find(user => user.username === username);

  if(!user){
    return response.status(404).json({
      error: 'Usuário não encontrado'
    });
  }

  request.user = user;

  return next();
}

function checksCreateTodosUserAvailability(request, response, next) {
  const {user} = request;

  if(!user.pro && user.todos.length >= 10){
    return response.status(403).json({error: 'O usuário não pode criar mais tarefas!'})
  }

  return next();
}

function checksTodoExists(request, response, next) {
  const {username} = request.headers;
  const {id} = request.params;
  
  if(!validate(id)){
    return response.status(400).json({
      error: 'Não foi fornecido um id válido'
    });
  }

  const user = users.find(user => user.username === username);

  if(!user){
    return response.status(404).json({
      error: 'Usuário não encontrado'
    });
  }

  const todo = user.todos.find(todo => todo.id === id);

  if(!todo){
    return response.status(404).json({
      error: 'Tarefa não encontrada'
    });
  }

  request.user = user;
  request.todo = todo;

  next();
}

function findUserById(request, response, next) {
  const {id} = request.params;

  const user = users.find(user => user.id === id);

  if(!user){
    return response.status(404).json({
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
    pro: false,
    todos: []
  }

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/users/:id", findUserById, (request, response) => {
  const {user} = request;

  return response.status(200).json(user);
});

app.patch("/users/:id/pro", findUserById, (request, response) => {
  const {user} = request;

  if(user.pro) {
    return response.status(400).json({
      error: 'Pro plan is already activated'
    });
  }

  user.pro = true;

  return response.status(200).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const todos = request.user.todos;

  return response.status(200).json(todos);
});

app.post("/todos", checksExistsUserAccount, checksCreateTodosUserAvailability, (request, response) => {
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

app.put("/todos/:id", checksTodoExists, (request, response) => {
  const {title, deadline} = request.body;
  const { todo } = request;

  if(title) todo.title = title;
  if(deadline) todo.deadline = new Date(deadline);

  return response.status(201).json(todo);
});

app.patch("/todos/:id/done", checksTodoExists, (request, response) => {
  const {todo} = request;

  todo.done = true;

  return response.status(201).json(todo);
});

app.delete("/todos/:id", checksExistsUserAccount, checksTodoExists, (request, response) => {
  const {id} = request.params;

  const todo = request.user.todos.find(todo => todo.id === id);

  if(!todo) return response.status(404).json({
    error: 'A tarefa não foi encontrada'
  });

  request.user.todos.splice(todo,1);

  return response.status(204).send();
});

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById
};
