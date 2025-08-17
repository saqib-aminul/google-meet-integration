import express from 'express';
import { createTask, updateTask, deleteTask } from '../services/taskService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  if (!req.body.tokens) {
    return res.status(401).json({ error: 'User not authenticated with Google.' });
  }

  try {
    const { tokens, ...taskData } = req.body;
    const task = await createTask(tokens, taskData);
    res.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

router.put('/:taskId', async (req, res) => {
  if (!req.body.tokens) {
    return res.status(401).json({ error: 'User not authenticated with Google.' });
  }

  try {
    const { tokens, ...taskData } = req.body;
    const { taskId } = req.params;
    console.log(req.params)
    const task = await updateTask(tokens, taskId, taskData);
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

router.post('/delete/:taskId', async (req, res) => {
  if (!req.body.tokens) {
    return res.status(401).json({ error: 'User not authenticated with Google.' });
  }

  try {
    const { tokens } = req.body;
    const { taskId } = req.params;
    await deleteTask(tokens, taskId);
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

export default router;