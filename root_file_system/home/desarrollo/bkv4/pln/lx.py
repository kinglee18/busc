import spacy
import sys,json
from spacy.symbols import nsubj, VERB



def run(nlp,texto):
    datos = []
    child = []
    doc = nlp(texto)

    verbs = set()
    for possible_subject in doc:
        if possible_subject.dep == nsubj and possible_subject.head.pos == VERB:
            verbs.add(possible_subject.head)
    print(verbs)
    

    for token in doc:
        childs = conexiones(token.children)
        datos.append({
            "texto": token.text,
            "lema": token.lemma_,
            "pos": token.pos_,
            "tag": token.tag_,
            "dep": token.dep_,
            "shape": token.shape_,
            "is_alpha": token.is_alpha,
            "is_digit": token.is_digit,
            "is_punct": token.is_punct,
            "is_currency": token.is_currency,
            "like_url": token.like_url,
            "like_num": token.like_num,
            "like_email": token.like_email,
            "is_oov": token.is_oov,
            "sentiment":token.sentiment,
            "orth": token.orth_,
            "ent": token.ent_type_,
            "whitespace": token.whitespace_,
            "head_text": token.head.text,
            "head_pos": token.head.pos,
            "conexion": childs
        })
    
    return datos


def conexiones(childs):
    data = []
    for child in childs:
        data.append(str(child))
    return data


if __name__ == '__main__':
    nlp = spacy.load('es')
    data = run(nlp,'hoteles abiertos ahora')
    print(json.dumps(data))