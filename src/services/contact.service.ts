import api from "../libs/axios";

export async function postAnswer(answerData: any) {
  try {
    const { data } = await api.put(
      `/prospect/answer`,
      answerData
    );
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
  }
}