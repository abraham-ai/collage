import Replicate from "https://cdn.jsdelivr.net/gh/nicholascelestin/replicate-js/replicate.js"

const replicate = new Replicate({
  proxyUrl: "https://app.dev.aws.abraham.fun/api", 
  pollingInterval: 1000
});

const model = await replicate.models.get("abraham-ai/eden-stable-diffusion");

export async function submitRequest(config) {
  console.log("lets go")
  const prediction = await model.predict(config);
  console.log("lets go 2")
  console.log(prediction)
  return prediction;
}

export async function downloadResult(resultUrl) {
  const url = `https://app.dev.aws.abraham.fun/dl?url=${resultUrl}`
  const result = await fetch(url).then(response => {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }
    return response.json()
  }).then(data => {
    return data.result;
  }).catch(error => {
    throw new Error(`Error: ${error.message}`)
  });
  return result;
}

