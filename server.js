const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

const DATA_FILE = './data/tickets.json';

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

const readTickets = () => {
  const data = fs.readFileSync(DATA_FILE);
  return JSON.parse(data);
};

const writeTickets = (tickets) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tickets, null, 2));
};

app.get('/api/tickets', (req, res) => {
  const tickets = readTickets();
  res.json(tickets);
});

app.post('/api/tickets', (req, res) => {
  const { clientName, businessName, issueType, description } = req.body;
  
  if (!clientName || !businessName || !issueType || !description) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const newTicket = {
    id: uuidv4(),
    ticketNumber: `BCK-${Math.floor(1000 + Math.random() * 9000)}`,
    clientName,
    businessName,
    issueType,
    description,
    status: 'Open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    internalComments: []
  };

  const tickets = readTickets();
  tickets.push(newTicket);
  writeTickets(tickets);

  res.status(201).json(newTicket);
});

app.patch('/api/tickets/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Open', 'In Progress', 'Resolved'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const tickets = readTickets();
  const ticketIndex = tickets.findIndex(t => t.id === req.params.id);
  
  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  tickets[ticketIndex].status = status;
  tickets[ticketIndex].updatedAt = new Date().toISOString();
  writeTickets(tickets);

  res.json(tickets[ticketIndex]);
});

app.post('/api/tickets/:id/comments', (req, res) => {
  const { comment } = req.body;
  
  if (!comment) {
    return res.status(400).json({ error: 'Comment is required' });
  }

  const tickets = readTickets();
  const ticketIndex = tickets.findIndex(t => t.id === req.params.id);
  
  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const newComment = {
    id: uuidv4(),
    text: comment,
    createdAt: new Date().toISOString(),
    author: 'Admin'
  };

  tickets[ticketIndex].internalComments.push(newComment);
  tickets[ticketIndex].updatedAt = new Date().toISOString();
  writeTickets(tickets);

  res.json(tickets[ticketIndex]);
});

app.delete('/api/tickets/:id', (req, res) => {
  const tickets = readTickets();
  const filteredTickets = tickets.filter(t => t.id !== req.params.id);
  
  if (filteredTickets.length === tickets.length) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  writeTickets(filteredTickets);
  res.json({ message: 'Ticket deleted successfully' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});