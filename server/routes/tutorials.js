import express from 'express';

// Rotas de tutoriais (armazenados em data/tutorials.json, sem banco).
// Recebe as dependencias via factory pra manter o server.js desacoplado
// e permitir testar/mockar sem subir o servidor inteiro.
//
// Monta em /api/tutorials no server.js.
export function createTutorialsRouter({ authenticateToken, readTutorials, writeTutorials }) {
  const router = express.Router();

  // GET /api/tutorials  (publico -- listagem)
  router.get('/', (req, res) => {
    const tutorials = readTutorials();
    // Ordena por data decrescente (mais novo primeiro)
    tutorials.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(tutorials);
  });

  // POST /api/tutorials
  router.post('/', authenticateToken, (req, res) => {
    const tutorials = readTutorials();
    const newTutorial = {
      ...req.body,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    tutorials.push(newTutorial);
    writeTutorials(tutorials);
    res.status(201).json(newTutorial);
  });

  // PUT /api/tutorials/:id
  router.put('/:id', authenticateToken, (req, res) => {
    const tutorials = readTutorials();
    const index = tutorials.findIndex((t) => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Tutorial não encontrado' });

    tutorials[index] = { ...tutorials[index], ...req.body };
    writeTutorials(tutorials);
    res.json(tutorials[index]);
  });

  // DELETE /api/tutorials/:id
  router.delete('/:id', authenticateToken, (req, res) => {
    let tutorials = readTutorials();
    tutorials = tutorials.filter((t) => t.id !== req.params.id);
    writeTutorials(tutorials);
    res.status(204).end();
  });

  return router;
}
