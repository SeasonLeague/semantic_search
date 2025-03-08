import sys
import json
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer, WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

try:
  nltk.data.find('corpora/stopwords')
  nltk.data.find('corpora/wordnet')
except LookupError:
  nltk.download('stopwords')
  nltk.download('punkt')
  nltk.download('wordnet')

class StemmedTfidfVectorizer(TfidfVectorizer):
    
    def __init__(self, *args, **kwargs):
        super(StemmedTfidfVectorizer, self).__init__(*args, **kwargs)
        self.stemmer = PorterStemmer()

    def build_analyzer(self):
        analyzer = super(StemmedTfidfVectorizer, self).build_analyzer()
        return lambda doc: [self.stemmer.stem(w) for w in analyzer(doc)]

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

def create_embedding(text_file):
    
    
    with open(text_file, 'r', encoding='utf-8') as f:
        text = f.read()
    
    
    preprocessed_text = preprocess_text(text)
    
    
    vectorizer = LemmatizedTfidfVectorizer(
        lowercase=True,
        norm='l2',
        ngram_range=(1, 2),  # Include both unigrams and bigrams
        max_features=300  # Limit to 300 features for efficiency
    )
    
    
    tfidf_matrix = vectorizer.fit_transform([preprocessed_text])
    
    
    embedding = tfidf_matrix.toarray()[0].tolist()
    
    return embedding

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python embed.py <text_file>")
        sys.exit(1)
    
    text_file = sys.argv[1]
    embedding = create_embedding(text_file)
    
    
    print(json.dumps(embedding))

