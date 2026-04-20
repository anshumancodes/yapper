const getRoute = (Name, name) => `import { Router } from 'express';
import { ${name}Controller } from './${name}.controller.js';
// import { verifyJWT } from '../common/middlewares/auth.js';

const router = Router();

// router.use(verifyJWT);

router.get('/',        ${name}Controller.find);
router.get('/:id',    ${name}Controller.findById);
router.post('/',      ${name}Controller.create);
router.patch('/:id',  ${name}Controller.patch);
router.delete('/:id', ${name}Controller.remove);

export default router;
`;

module.exports = getRoute;
