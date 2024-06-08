const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "https://book-management-fa1b.onrender.com",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.use(express.json());
app.use(cors());

let books = [];

function broadcastUpdate(event, data) {
    io.emit(event, data);
}

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.emit('initialData', books);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

app.post('/add-book', (req, res) => {
    const book = req.body;
    book.id = books.length + 1;
    books.push(book);
    broadcastUpdate('BookAdded', book);
    res.status(201).json(book);
});

app.put('/update-book/:id', (req, res) => {
    const { id } = req.params;
    const updatedBook = req.body;
    const index = books.findIndex(book => book.id === parseInt(id));
    if (index !== -1) {
        books[index] = { ...books[index], ...updatedBook, id: parseInt(id) };
        broadcastUpdate('BookUpdated', books[index]);
        res.json(books[index]);
    } else {
        res.status(404).send('Book not found');
    }
});

app.delete('/delete-book/:id', (req, res) => {
    const { id } = req.params;
    const index = books.findIndex(book => book.id === parseInt(id));
    if (index !== -1) {
        const deletedBook = books.splice(index, 1);
        broadcastUpdate('BookDeleted', parseInt(id));  // Send ID directly
        res.json(deletedBook[0]);
    } else {
        res.status(404).send('Book not found');
    }
});

// Use the port provided by the environment or default to 30001
const PORT = process.env.PORT || 30001;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});


