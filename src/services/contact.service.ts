import axios from "axios";

export async function postAnswer(answerData: any) {
  try {
    const { data } = await axios.put(
      `${import.meta.env.VITE_SERVER_URL}/prospect/answer`,
      answerData
    );
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
  }
}