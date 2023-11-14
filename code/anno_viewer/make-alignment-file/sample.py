from json_to_csv import *

from similarity_functions import *

import json

func_name_list = [
    "SB",
    "tf-idf",
    "Jaccard"
]

sb_model = create_sentence_model('all-MiniLM-L6-v2')

def sb_placeholder(sent1, sent2):
    return sentenceBERT_similarity(sb_model, sent1, sent2).item()

tf_model = create_TFIDF_model("test.source.txt", "test.target.txt", "stop_words_english.txt")

def tf_placeholder(sent1, sent2):
    return tfidf_similarity(tf_model, sent1, sent2)

func_list = [
    sb_placeholder,
    tf_placeholder,
    jaccard_similarity
]

data_dict = []

with open("sample_json_file.json") as d:
    data_dict = json.load(d)

data = create_data(data_dict, func_list, func_name_list)

with open("three_doc_data.csv", "w") as d:
    d.write(data)
