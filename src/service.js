const getService = (Name, name) => `import { ${Name} } from '../schemas/${name}.schema.js';
import { ApiError } from '../common/error.js';

export const ${name}Service = {

  async find(query: Record<string, unknown> = {}) {
    const { page = 1, limit = 20, sort = '-createdAt', ...filters } = query as any;
    const skip = (Number(page) - 1) * Number(limit);
    const baseFilter = { deleted: { $ne: true }, ...filters };

    const [data, total] = await Promise.all([
      ${Name}.find(baseFilter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ${Name}.countDocuments(baseFilter),
    ]);

    return { data, total, page: Number(page), limit: Number(limit) };
  },

  async findById(id: string) {
    const doc = await ${Name}.findOne({ _id: id, deleted: { $ne: true } }).lean();
    if (!doc) throw new ApiError(404, '${Name} not found');
    return doc;
  },

  async create(payload: Record<string, unknown>) {
    const doc = await ${Name}.create(payload);
    return doc;
  },

  async patch(id: string, payload: Record<string, unknown>) {
    const doc = await ${Name}.findOneAndUpdate(
      { _id: id, deleted: { $ne: true } },
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();
    if (!doc) throw new ApiError(404, '${Name} not found');
    return doc;
  },

  async remove(id: string, userId: string) {
    const doc = await ${Name}.findOneAndUpdate(
      { _id: id, deleted: { $ne: true } },
      { $set: { deleted: true, deletedAt: new Date(), deletedBy: userId } },
      { new: true }
    ).lean();
    if (!doc) throw new ApiError(404, '${Name} not found');
    return doc;
  },
};
`;

module.exports = getService;
