const router = require("express").Router();
const ctrl = require("../controllers/tarefas.controller");

// Básico
router.post("/", ctrl.criar);
router.get("/:id", ctrl.obter);

// Consulta por usuário
router.get("/usuario/:usuario_id", ctrl.listarPorUsuario);

// router.put("/:id", ctrl.atualizar);
// router.delete("/:id", ctrl.remover);

module.exports = router;