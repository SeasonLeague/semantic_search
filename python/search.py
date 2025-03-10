import sys
import json
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer, WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


try:
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('stopwords')
    nltk.download('punkt')
    nltk.download('wordnet')

class LemmatizedTfidfVectorizer(TfidfVectorizer):
   
    def __init__(self, *args, **kwargs):
        super(LemmatizedTfidfVectorizer, self).__init__(*args, **kwargs)
        self.lemmatizer = WordNetLemmatizer()

    def build_analyzer(self):
        analyzer = super(LemmatizedTfidfVectorizer, self).build_analyzer()
        return lambda doc: [self.lemmatizer.lemmatize(w) for w in analyzer(doc)]

def preprocess_text(text):
    
    
    tokens = nltk.word_tokenize(text.lower())
    
    stop_words = set(stopwords.words('english'))
    tokens = [token for token in tokens if token not in stop_words]
    return ' '.join(tokens)

def perform_search(data_file):
    
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    documents = data['documents']
    query = data['query']
    
    if not documents:
        return []
    
   
    doc_contents = [doc['content'] for doc in documents]
    doc_processed = [preprocess_text(doc) for doc in doc_contents]
    
    
    vectorizer = LemmatizedTfidfVectorizer(
        lowercase=True,
        norm='l2',
        ngram_range=(1, 2)  
    )
    
    
    tfidf_matrix = vectorizer.fit_transform(doc_processed)
    
    
    processed_query = preprocess_text(query)
    query_vector = vectorizer.transform([processed_query])
    
    
    similarities = cosine_similarity(query_vector, tfidf_matrix)[0]
    
    
    phrase_scores = []
    for doc in doc_contents:
        
        if query.lower() in doc.lower():
            phrase_scores.append(0.3)  # Boost score by 0.3
        else:
            phrase_scores.append(0)
    
    
    combined_scores = [sim + boost for sim, boost in zip(similarities, phrase_scores)]
    
    
    results = []
    for i, score in enumerate(combined_scores):
        if score > 0:  # Only include documents with some similarity
            doc = documents[i]
            results.append({
                '_id': doc['_id'],
                'title': doc['title'],
                'content': doc['content'],
                'tags': doc.get('tags', []),
                'score': min(float(score), 1.0)  # Convert numpy float to Python float, cap at 1.0
            })
    
   
    results.sort(key=lambda x: x['score'], reverse=True)
    
    
    return results[:10]

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python search.py <data_file>")
        sys.exit(1)
    
    data_file = sys.argv[1]
    search_results = perform_search(data_file)
    
    
    print(json.dumps(search_results))

