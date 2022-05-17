const propositionsDataMapper = require('../database/models/propositions.datamapper');

const propositionsController = {
  async availablePropositionsSlots(_, res) {
    const results = await propositionsDataMapper.getAvailablePropositionSlots();
    res.status(200).json(results);
  },

  async pendingPropositions(_, res) {
    const results = await propositionsDataMapper.getPendingPropositions();
    res.status(200).json(results);
  },

  async userPendingPropositionsById(req, res) {
    const results = await propositionsDataMapper.getPendingPropositionByUserID(req.params.userId);
    res.status(200).json(results);
  },
  async bookPendingPropositionsSlot(req, res) {
    const results = await propositionsDataMapper.bookPropositionSlot(req.params.publishingDate);
    res.status(201).json(results);
  },
};

module.exports = propositionsController;
