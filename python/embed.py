import sys
import json
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer, WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

# Download NLTK resources if not already downloaded
try:
  nltk.data.find('corpora/stopwords')
  nltk.data.find('corpora/wordnet')
except LookupError:
  nltk.download('stopwords')
  nltk.download('punkt')
  nltk.download('wordnet')

class StemmedTfidfVectorizer(TfidfVectorizer):
    """
    Custom TF-IDF vectorizer that applies stemming during preprocessing
    """
    def __init__(self, *args, **kwargs):
        super(StemmedTfidfVectorizer, self).__init__(*args, **kwargs)
        self.stemmer = PorterStemmer()

    def build_analyzer(self):
        analyzer = super(StemmedTfidfVectorizer, self).build_analyzer()
        return lambda doc: [self.stemmer.stem(w) for w in analyzer(doc)]

class LemmatizedTfidfVectorizer(TfidfVectorizer):
    """
    Custom TF-IDF vectorizer that applies lemmatization during preprocessing
    """
    def __init__(self, *args, **kwargs):
        super(LemmatizedTfidfVectorizer, self).__init__(*args, **kwargs)
        self.lemmatizer = WordNetLemmatizer()

    def build_analyzer(self):
        analyzer = super(LemmatizedTfidfVectorizer, self).build_analyzer()
        return lambda doc: [self.lemmatizer.lemmatize(w) for w in analyzer(doc)]

def preprocess_text(text):
    """
    Apply preprocessing to text: lowercase, tokenize, remove stopwords
    """
    # Tokenize
    tokens = nltk.word_tokenize(text.lower())
    # Remove stopwords
    stop_words = set(stopwords.words('english'))
    tokens = [token for token in tokens if token not in stop_words]
    return ' '.join(tokens)

def create_embedding(text_file):
    """
    Create a TF-IDF embedding for the text in the given file.
    
    Args:
        text_file: Path to the file containing the text to embed
        
    Returns:
        A list representing the TF-IDF vector
    """
    # Read the text from the file
    with open(text_file, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Preprocess the text
    preprocessed_text = preprocess_text(text)
    
    # Initialize the vectorizer
    vectorizer = LemmatizedTfidfVectorizer(
        lowercase=True,
        norm='l2',
        ngram_range=(1, 2),  # Include both unigrams and bigrams
        max_features=300  # Limit to 300 features for efficiency
    )
    
    # Fit and transform the text
    tfidf_matrix = vectorizer.fit_transform([preprocessed_text])
    
    # Convert sparse matrix to dense array and then to list
    embedding = tfidf_matrix.toarray()[0].tolist()
    
    return embedding

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python embed.py <text_file>")
        sys.exit(1)
    
    text_file = sys.argv[1]
    embedding = create_embedding(text_file)
    
    # Print the embedding as JSON to stdout
    print(json.dumps(embedding))

