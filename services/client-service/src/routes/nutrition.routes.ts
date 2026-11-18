import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { getNutritionState, putPreferences, getRecipes, postMenu, getMenu, putPurchase } from "../controllers/nutrition.controller.js";

const router: Router = Router();
router.use(authenticate, authorize("member"));
router.get("/", getNutritionState);
router.put("/preferences", putPreferences);
router.get("/recipes", getRecipes);
router.post("/menus", postMenu);
router.get("/menus/:id", getMenu);
router.put("/menus/:id/shopping", putPurchase);
export default router;
