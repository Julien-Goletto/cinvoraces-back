const usersDataMapper = require('../database/models/users.datamapper');
const APIError = require('../Errors/APIError');
const jwtMethods = require('../JWT/jwt.module');
require('dotenv').config();
const cloudinaryUpload = require('../external_api/cloudinary.module');

const { CLOUDINARY_URL } = process.env;

// const cookieOption = { httpOnly: true, sameSite: 'none', secure: true };

const usersController = {
  async createUser(req, res) {
    const user = req.body;
    const result = await usersDataMapper.createUser(user);
    res.status(201).json(result);
  },

  async logUser(req, res) {
    const user = req.body;
    const result = await usersDataMapper.logUser(user);
    const accessToken = jwtMethods.createAccessToken(result);
    const refreshToken = jwtMethods.createRefreshToken(result);
    res.cookie('accessToken', accessToken);
    res.cookie('refreshToken', refreshToken);
    result.accessToken = accessToken;
    result.refreshToken = refreshToken;
    res.status(200).json(result);
  },

  async addProfilePic(req, res) {
    const requestedUserId = parseInt(req.params.userId, 10);
    // Additionnal Safe guard
    const { token } = req.session;
    const user = jwtMethods.decryptAccessToken(token);
    const requestingUserId = user.id;
    const userPseudo = user.pseudo;
    if (requestedUserId !== requestingUserId) {
      throw new APIError("Vous n'avez pas la permission de modifier cette photo de profil.", '', 401);
    }
    const { sourceImage } = req.body;
    const avatarUrl = await cloudinaryUpload.uploadThumbnail(
      CLOUDINARY_URL,
      userPseudo,
      sourceImage,
    );
    const results = await usersDataMapper.addProfilePic(requestedUserId, avatarUrl);
    res.status(201).json(results);
  },

  async updateUser(req, res) {
    const requestedUserId = parseInt(req.params.userId, 10);
    // Additionnal Safe guard
    const { token } = req.session;
    const requestingUserId = jwtMethods.decryptAccessToken(token).id;
    const requestingToken = jwtMethods.decryptAccessToken(token).role;
    console.log(requestingToken);
    if (requestedUserId === requestingUserId || requestingToken === 'admin') {
      const user = req.body;
      const results = await usersDataMapper.updateUser(requestedUserId, user);
      res.status(201).json(results);
    }
    throw new APIError("Vous n'avez la permission pour modifier ces champs.", req.url, 401);
  },

  async getUserById(req, res) {
    const requestedUserId = parseInt(req.params.userId, 10);
    const { token } = req.session;
    const requestingUserId = jwtMethods.decryptAccessToken(token).id;
    let hasRights = false;
    if (requestedUserId === requestingUserId) {
      hasRights = true;
    }
    const result = await usersDataMapper.getUserById(requestedUserId, hasRights);
    res.status(200).json(result);
  },

  async getUsersList(_, res) {
    const results = await usersDataMapper.getUsersList();
    res.status(200).json(results);
  },

  async deleteUser(req, res) {
    const userId = parseInt(req.params.userId, 10);
    const { token } = req.session;
    const requestingUserRole = jwtMethods.decryptAccessToken(token).role;
    if (requestingUserRole !== 'admin') {
      throw new APIError("Vous n'avez pas l'autorisation de supprimer un utilisateur", req.url, 401);
    }
    const results = await usersDataMapper.deleteUserById(userId);
    res.status(200).json(results);
  },
  async togglePrivileges(req, res) {
    const userId = parseInt(req.params.userId, 10);
    const { token } = req.session;
    const requestingUserRole = jwtMethods.decryptAccessToken(token).role;
    if (requestingUserRole !== 'admin') {
      throw new APIError("Vous n'avez pas d'éditer un utilisateur", req.url, 401);
    }
    const results = await usersDataMapper.togglePrivileges(userId);
    console.log(results);
    res.status(201).json(results);
  },
};

module.exports = usersController;
