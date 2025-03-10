

export async function createEmbedding(text: string): Promise<number[]> {
  try {
  
    const response = await fetch("/api/python/embed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error("Failed to create embedding")
    }

    const data = await response.json()
    return data.embedding
  } catch (error) {
    console.error("Error creating embedding:", error)
    throw error
  }
}

