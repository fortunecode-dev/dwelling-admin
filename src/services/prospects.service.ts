import { waitForToken } from "../libs/auth";
import api from "../libs/axios";
export async function getActiveProspects() {
  try {
    await waitForToken()
    const { data } = await api.get(`/prospect/manage`);
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
    return null
  }
}
export async function getAllProspects() {
  try {
    const { data } = await api.get(`/prospect/manage`,{params:{mode:"all"}});
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
    return null
  }
}
export async function postAnswerQuestion(questionId:string,email:string,answer:string) {
  try {
    const { data } = await api.put(`/prospect/answer`,{questionId,answer,email});
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
    return null
  }
}
export async function getDeletedProspects() {
  try {
    const { data } = await api.get(`/prospect/manage`,{params:{mode:"deleted"}});
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
    return null
  }
}
export async function deleteProspect(id: string) {
  try {
    const { data } = await api.delete(`/prospect/manage/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
  }
}
export async function restoreProspect(id: string) {
  try {
    const { data } = await api.patch(`/prospect/manage/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
  }
}

export async function updateProspect(id: string, prospectData: any) {
  try {
    const { data } = await api.put(
      `/prospect/manage/${id}`,
      prospectData
    );
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
  }
}
export async function postProspect(prospectData: any) {
  try {
    const { data } = await api.post(
      `/prospect/manage`,
      prospectData
    );
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
  }
}
export async function getProspect(id: string) {
  try {
    const { data } = await api.get(`/prospect/manage/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
    return {};
  }
}