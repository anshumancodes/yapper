const getController = (Name, name) => `import { Request, Response, NextFunction } from 'express';
import { ${name}Service } from './${name}.service.js';
import { ApiResponse } from '../common/response.js';

export const ${name}Controller = {

  async find(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ${name}Service.find(req.query);
      res.status(200).json(new ApiResponse(200, result, '${Name}s fetched successfully'));
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await ${name}Service.findById(req.params.id);
      res.status(200).json(new ApiResponse(200, doc, '${Name} fetched successfully'));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = { ...req.body, createdBy: (req as any).user?._id };
      const doc = await ${name}Service.create(payload);
      res.status(201).json(new ApiResponse(201, doc, '${Name} created successfully'));
    } catch (err) {
      next(err);
    }
  },

  async patch(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = { ...req.body, updatedBy: (req as any).user?._id };
      const doc = await ${name}Service.patch(req.params.id, payload);
      res.status(200).json(new ApiResponse(200, doc, '${Name} updated successfully'));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await ${name}Service.remove(req.params.id, (req as any).user?._id);
      res.status(200).json(new ApiResponse(200, doc, '${Name} deleted successfully'));
    } catch (err) {
      next(err);
    }
  },
};
`;

module.exports = getController;
