class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  create(data) {
    return this.model.create(data);
  }

  findById(id, options = {}) {
    let q = this.model.findById(id);
    if (options.populate) q = q.populate(options.populate);
    if (options.select) q = q.select(options.select);
    return q;
  }

  findOne(filter, options = {}) {
    let q = this.model.findOne(filter);
    if (options.populate) q = q.populate(options.populate);
    if (options.select) q = q.select(options.select);
    return q;
  }

  find(filter = {}, options = {}) {
    let q = this.model.find(filter);
    if (options.populate) q = q.populate(options.populate);
    if (options.select) q = q.select(options.select);
    if (options.sort) q = q.sort(options.sort);
    if (options.skip) q = q.skip(options.skip);
    if (options.limit) q = q.limit(options.limit);
    return q;
  }

  updateById(id, data, options = { new: true, runValidators: true }) {
    return this.model.findByIdAndUpdate(id, data, options);
  }

  deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  findByIds(ids) {
    return this.model.find({ _id: { $in: ids } });
  }

  aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }
}

module.exports = BaseRepository;
