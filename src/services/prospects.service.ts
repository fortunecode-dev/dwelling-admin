import axios from "axios"
export async function getActiveProspects() {
  try {
    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/prospect/manage`);
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
    return null
  }
}
export async function getAllProspects() {
  try {
    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/prospect/manage`,{params:{mode:"all"}});
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
    return null
  }
}
export async function getDeletedProspects() {
  try {
    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/prospect/manage`,{params:{mode:"deleted"}});
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
    return null
  }
}
export async function deleteProspect(id: string) {
  try {
    const { data } = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/prospect/manage/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
  }
}
export async function restoreProspect(id: string) {
  try {
    const { data } = await axios.patch(`${import.meta.env.VITE_SERVER_URL}/prospect/manage/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
  }
}

export async function updateProspect(id: string, prospectData: any) {
  try {
    const { data } = await axios.put(
      `${import.meta.env.VITE_SERVER_URL}/prospect/manage/${id}`,
      prospectData
    );
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
  }
}
export async function postProspect(prospectData: any) {
  try {
    const { data } = await axios.post(
      `${import.meta.env.VITE_SERVER_URL}/prospect/manage`,
      prospectData
    );
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
  }
}
export async function getProspect(id: string) {
  try {
    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/prospect/manage/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching prospect URL:", error);
    return {};
  }
}