import { BASE_URL, routes } from "@/config"
import {
  Gender,
  GetTestResultsPayload,
  Question,
  QuestionOption,
  SessionData,
  Submission,
  TestResult,
  TraitsResponse,
} from "@/types"
import { replaceMap } from "@/utils/replaceMap"
import session, { createSession } from "@/utils/session"
import { HttpError } from "@/utils/httpError"

type PersonalitySession = typeof session

const personalityNames: Record<string, string> = {
  INTJ: "Architect",
  INTP: "Logician",
  ENTJ: "Commander",
  ENTP: "Debater",
  INFJ: "Advocate",
  INFP: "Mediator",
  ENFJ: "Protagonist",
  ENFP: "Campaigner",
  ISTJ: "Logistician",
  ISFJ: "Defender",
  ESTJ: "Executive",
  ESFJ: "Consul",
  ISTP: "Virtuoso",
  ISFP: "Adventurer",
  ESTP: "Entrepreneur",
  ESFP: "Entertainer",
}

/**
 * @deprecated
 */
const startSession = async (ip: string) => {
  await session.get(BASE_URL)
  const res = await session.get(routes["api.session"])

  if (!res.config.jar) {
    throw new HttpError(500, "No cookies found")
  }

  return res.data
}

const getSession = async (
  client: PersonalitySession = session
): Promise<SessionData> => {
  const res = await client.get(routes["api.session"])

  return res.data
}

const getTraits = async (
  client: PersonalitySession = session
): Promise<TraitsResponse> => {
  const res = await client.post(routes["api.profile.traits"], {})

  return res.data
}

const getPersonalityTest = async (
  client: PersonalitySession = session
): Promise<Array<Question>> => {
  const res = await client.get(`${BASE_URL}/free-personality-test`)
  const regex = new RegExp(/:questions="(\[.*?\])"/, "gm")
  const matches = regex.exec(res.data)

  if (!matches) throw new Error("No matches found")

  // console.log(matches[2])
  const unparsedQuestions = matches[1]

  const replacedQuestions = Object.entries(replaceMap).reduce(
    (acc, [key, value]) => acc.replaceAll(key, value),
    unparsedQuestions
  )
  const questions = JSON.parse(replacedQuestions)

  const defaultOptions: QuestionOption[] = [
    { text: "Disagree strongly", value: -3 },
    { text: "Disagree moderately", value: -2 },
    { text: "Disagree a little", value: -1 },
    { text: "Neither agree nor disagree", value: 0 },
    { text: "Agree a little", value: 1 },
    { text: "Agree moderately", value: 2 },
    { text: "Agree strongly", value: 3 },
  ]

  return questions.map((question: any) => {
    const text = typeof question === "string" ? question : question.text

    return {
      id: Buffer.from(text).toString("base64url"),
      text,
      options: defaultOptions,
    }
  })
}

const getTestResults = async (
  submissionData: Submission[],
  gender: Gender
): Promise<TestResult> => {
  const client = createSession()
  await client.get(`${BASE_URL}/free-personality-test`)

  const questions: Array<
    Omit<Submission, "id" | "value"> & { text: string; answer: number }
  > = submissionData.map((s) => ({
    text: Buffer.from(s.id, "base64url").toString(),
    answer: s.value,
  }))

  const payload = {
    extraData: [],
    gender,
    questions,
    teamInviteKey: "",
    inviteCode: "",
  }

  const res = await client.post<GetTestResultsPayload>(
    routes["test-results"],
    payload
  )

  const sess = await getSession(client)

  const traitsData = await getTraits(client)

  return {
    avatarAlt: sess.user.avatarAlt,
    avatarSrc: sess.user.avatar,
    avatarSrcStatic: sess.user.avatarFull,
    personality: sess.user.personality,
    variant: sess.user.variant,
    niceName:
      sess.user.localized?.niceType ??
      personalityNames[sess.user.personality] ??
      sess.user.personality,
    profileUrl: sess.user.localized?.profileUrl ?? res.data.redirect,
    traits: traitsData.traits,
    role: sess.user.role,
    strategy: sess.user.strategy,
  }
}

export default {
  startSession,
  getPersonalityTest,
  getTestResults,
  getSession,
}
