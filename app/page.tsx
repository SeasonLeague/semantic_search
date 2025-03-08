import { SearchBar } from "@/components/search-bar"
import { DocumentUpload } from "@/components/document-upload"
import { DocumentList } from "@/components/document-list"
import { DocumentProvider } from "@/lib/document-context"

export default function Home() {
  return (
    <DocumentProvider>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Semantic Search Engine</h1>

        <div className="mb-8">
          <SearchBar />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>
            <DocumentUpload />
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Recent Documents</h2>
            <DocumentList />
          </div>
        </div>
      </main>
    </DocumentProvider>
  )
}

