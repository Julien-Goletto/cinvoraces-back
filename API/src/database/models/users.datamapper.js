/* eslint-disable no-restricted-syntax */
const bcrypt = require('bcryptjs');
const client = require('../dbclient');
const APIError = require('../../Errors/APIError');

const usersDataMapper = {

  /**
   * Save a  new user in database, using bcrypt for password encrypting
   * @param {Object} user
   * @returns {String} feedback message
   */
  async createUser(user) {
    const { pseudo, mail, password } = user;
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);
    const query = {
      text: 'INSERT INTO "user"("pseudo", "mail", "password") VALUES ($1,$2,$3)',
      values: [pseudo, mail, encryptedPassword],
    };
    const results = await client.query(query);
    if (!results.rowCount) {
      throw new APIError('Ce pseudo ou cet email sont déjà enregistrés.', '', 400);
    }
    return 'Utilisateur enregistré avec succès, merci de vous connecter.';
  },

  /**
   * Log user with database and using bcrypt
   * @param {Object} user informations
   * @returns {Object} feedback message
   * @throws {APIError} if user enter invalid credential
   */
  async logUser(user) {
    const query = {
      text: 'SELECT * FROM "user" WHERE pseudo=$1',
      values: [user.pseudo],
    };
    const result = await client.query(query);
    if (!result.rowCount) {
      throw new APIError('Informations éronnées', '', 400); // à déplacer dans les controllers
    }
    if (!await bcrypt.compare(user.password, result.rows[0].password)) {
      throw new APIError('Informations éronnées', '', 400);
    }
    const keys = ['id', 'pseudo', 'role'];
    return Object.fromEntries(
      // eslint-disable-next-line comma-dangle
      Object.entries(result.rows[0]).filter(([key]) => keys.includes(key))
    );
  },

  /**
   * Modify user informations
   * @param {string} userId of user
   * @param {Object} user informations
   * @throws {APIError} if user doesn't exist
   */
  async updateUser(userId, user) {
    const userToModify = user;
    if (userToModify.password) {
      const salt = await bcrypt.genSalt(10);
      const passwordCrypted = await bcrypt.hash(userToModify.password, salt);
      userToModify.password = passwordCrypted;
    }
    let query = {
      text: 'SELECT * FROM "user" WHERE id = $1',
      values: [userId],
    };
    const result = await client.query(query);
    if (!result.rowCount) {
      throw new APIError("Ce compte n'existe pas.", '', 404);
    }
    if (!await bcrypt.compare(userToModify.oldPassword, result.rows[0].password)) {
      throw new APIError('Informations éronnées', '', 400);
    }
    delete userToModify.oldPassword;
    query = { text: 'UPDATE "user" SET ', values: [] };
    let i = 1;
    for (const key of Object.keys(userToModify)) {
      query.text += `"${key}" = $${i},`;
      query.values.push(userToModify[key]);
      i += 1;
    }
    query.text = query.text.slice(0, -1);
    query.text += ` WHERE id=$${i}`;
    query.values.push(userId);
    await client.query(query);
    return 'Modifications effectuées.';
  },

  /**
   * User object, return matching user
   * @param {Object} user
   * @returns {Object} informations from db for user
   * @throws {APIError} if user doesen't in db
   */
  async getUserById(userId, hasRights) {
    let columns = 'id,pseudo,avatar_url,created_at';
    if (hasRights) {
      columns += ',mail';
    }
    const query = {
      text: `SELECT ${columns} FROM "user" WHERE id=$1`,
      values: [userId],
    };
    const result = await client.query(query);
    if (!result.rowCount) {
      throw new APIError("Ce compte n'existe pas.", '', 404);
    }
    return result.rows[0];
  },

  /**
   * Return a list containing all registered users
   * @returns {ARRAY} of pseudos String
   * @throws {APIError} if the table user is empty
   */
  async getUsersList() {
    const query = 'SELECT "user".id, "user".pseudo, "user".avatar_url, "user".created_at FROM "user";';
    const results = await client.query(query);
    if (!results.rowCount) {
      throw new APIError('Aucun utilisateurs enregistré.', '', 404);
    }
    return results.rows;
  },
  async deleteUserById(userId) {
    const query = {
      text: 'DELETE FROM "user" WHERE id = $1;',
      values: [userId],
    };
    const results = await client.query(query);
    if (!results.rowCount) {
      throw new APIError("Cet utilisateur n'existe pas.", 404);
    }
    return `Utilisateur ${userId} supprimé.`;
  },
};

module.exports = usersDataMapper;
