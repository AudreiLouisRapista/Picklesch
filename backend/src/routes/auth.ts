import { Router } from 'express';

import { loginUser, logoutUser, refreshUserTokens, registerUser } from '../modules/auth/service';

const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    res.status(201).json(await registerUser(req.body));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    res.status(200).json(await loginUser(req.body));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    res.status(200).json(await refreshUserTokens(req.body));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    await logoutUser(req.body);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default authRouter;
