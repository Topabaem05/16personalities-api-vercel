import { Router } from "express"
import { catchAsync } from "catch-async-express"

import personalityController from "@/controllers/personality.controller"
import validator from "@/middlewares/validator.middleware"
import personalityRoutes from "./routes/personality.routes"
import testValidator from "@/validators/test.validator"

const router = Router()

router.get("/questions", catchAsync(personalityController.getQuestions))
router.post(
  "/result",
  validator({ body: testValidator.submission }),
  catchAsync(personalityController.submit)
)
router.use("/personality", personalityRoutes)

export default router
