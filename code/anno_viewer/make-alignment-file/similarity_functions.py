import nltk
import json

from nltk.tokenize import sent_tokenize
from nltk.metrics.distance import jaccard_distance
from nltk.tokenize import RegexpTokenizer

from bert_score import score
from sentence_transformers import SentenceTransformer, util
from massalign.core import *

import numpy as np


#extracts random documents from json files
#if num_pairs is -1, which is default, all documents
#are processed
def extract_rand_doc_pair(filename, num_pairs=-1):
    
    data_dict = []

    with open(filename) as d:
        data_dict = json.load(d)
    
    return_dict = []

    randInds = list(range(0, len(data_dict)))

    if (num_pairs != -1):
        randInds = np.random.randint(0, len(data_dict), num_pairs)
    nltk.download('punkt')

    for ind in randInds:
        obj = data_dict[ind]
        
        ret_obj = {}
        ret_obj["complex"] = sent_tokenize(obj["complex"])
        ret_obj["simple"] = sent_tokenize(obj["simplified"])
        return_dict.append(ret_obj)

    return return_dict

def cochrane_extract_doc_pair(filename, num_pairs=-1):
    
    data_dict = []

    with open(filename) as d:
        data_dict = json.load(d)
    
    return_dict = []

    randInds = list(range(0, len(data_dict)))

    if (num_pairs != -1):
        randInds = np.random.randint(0, len(data_dict), num_pairs)
    nltk.download('punkt')

    for ind in randInds:
        obj = data_dict[ind]
        
        ret_obj = {}
        ret_obj["doi"] = obj["doi"]
        ret_obj["complex"] = sent_tokenize(obj["abstract"])
        ret_obj["simple"] = sent_tokenize(obj["pls"])
        return_dict.append(ret_obj)

    return return_dict
    

def jaccard_similarity(sent1, sent2):
    
    #lowercase the sentences
    sent1_low = sent1.lower()
    sent2_low = sent2.lower()

    #now tokenize them to remove punctuation
    tokenizer = RegexpTokenizer(r'\w+')
    set1 = set(tokenizer.tokenize(sent1_low))
    set2 = set(tokenizer.tokenize(sent2_low))

    uni = len(set1 | set2)
    inter = len(set1 & set2)

    if uni == 0:
        return 0

    return inter/uni


def bertscore_similarity(sent1, sent2):
    _, _, f1 = score([sent1], [sent2], lang="en")
    return f1

def create_sentence_model(model_name):
    model = SentenceTransformer(model_name)
    return model

def sentenceBERT_similarity(model, sent1, sent2):
    emb1 = model.encode(sent1)
    emb2 = model.encode(sent2)
    return util.cos_sim(emb1, emb2)

def create_TFIDF_model(source, target, stop_words):
    return TFIDFModel([source, target], stop_words)

def tfidf_similarity(model, sent1, sent2):
    return model.getTextSimilarity(sent1, sent2)

