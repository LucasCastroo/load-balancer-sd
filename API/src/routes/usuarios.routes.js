const router = require("express").Router();
const ctrl = require("../controllers/usuarios.controller");

// CRUD mínimo
router.post("/", ctrl.criar);
router.get("/", ctrl.listar);
router.get("/:id", ctrl.obter);

// Lista tarefas de um usuário (atalho útil para a apresentação)
router.get("/:id/tarefas", ctrl.listarTarefasDoUsuario);

module.exports = router;
