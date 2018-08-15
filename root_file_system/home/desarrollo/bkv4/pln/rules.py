import spacy
import sys,json
from spacy.matcher import Matcher

nlp = spacy.load('es')
matcher = Matcher(nlp.vocab)

#Reglas

matcher.add('PRECIO', None,
    [{'ORTH':'$'}, {'IS_DIGIT':True}],
    [{'IS_DIGIT':True},{'ORTH':'pesos'}])

matcher.add('HORARIO', None,
    [{'LEMMA':'abrir'}, {'ORTH':'ahorita'}],
    [{'LEMMA':'abrir'}, {'LEMMA':'ahora'}],
    [{'LEMMA':'abrir'}, {'ORTH':'hoy'}],
    [{'LEMMA':'abrir'}, {'ORTH':'manana'}],
    [{'LEMMA':'abrir'}, {'ORTH':'pasado'},{'ORTH':'manana'}],
    [{'LEMMA':'abrir'}, {'POS':'DET'},{'ORTH':'lunes'}],
    [{'LEMMA':'abrir'}, {'POS':'DET'},{'ORTH':'martes'}],
    [{'LEMMA':'abrir'}, {'POS':'DET'},{'ORTH':'miercoles'}],
    [{'LEMMA':'abrir'}, {'POS':'DET'},{'ORTH':'jueves'}],
    [{'LEMMA':'abrir'}, {'POS':'DET'},{'ORTH':'viernes'}],
    [{'LEMMA':'abrir'}, {'POS':'DET'},{'ORTH':'sabado'}],
    [{'LEMMA':'abrir'}, {'POS':'DET'},{'ORTH':'domingo'}],
    [{'LEMMA':'abrir'}, {'POS':'DET'},{'ORTH':'fin'},{'ORTH':'de'},{'ORTH':'semana'}])

matcher.add('PAGOS', None,
    [{'LEMMA':'tarjeta'}, {'ORTH':'visa'}],
    [{'LEMMA':'tarjeta'}, {'ORTH':'master'},{'ORTH':'card'}],
    [{'LEMMA':'tarjeta'}, {'ORTH':'amarican'},{'ORTH':'express'}],
    [{'LEMMA':'pago'}, {'ORTH':'en'},{'ORTH':'efectivo'}],
    [{'LEMMA':'pago'}, {'ORTH':'con'},{'ORTH':'vales'}],
    [{'LEMMA':'pago'}, {'ORTH':'con'},{'ORTH':'cheques'}],
    [{'LEMMA':'pago'}, {'ORTH':'con'},{'ORTH':'paypal'}],
    [{'LEMMA':'pago'}, {'ORTH':'en'},{'ORTH':'paypal'}])

matcher.add('DESCUENTO_NUM', None,
    [{'LEMMA':'descontar'}, {'IS_DIGIT':True},{'ORTH':'%'}],
    [{'LEMMA':'descontar'}, {'POS': 'ADP'}, {'IS_DIGIT':True},{'ORTH':'%'}],
    [{'LEMMA':'descontar'}, {'POS': 'ADP'},{'POS': 'DET'},{'IS_DIGIT':True},{'ORTH':'%'}])

matcher.add('DESCUENTO', None,
    [{'ORTH':'en'},{'LEMMA':'descontar'}],
    [{'ORTH':'con'},{'LEMMA':'descontar'}],
    [{'ORTH':'con'},{'LEMMA':'ofertar'}],
    [{'ORTH':'en'},{'LEMMA':'ofertar'}])


matcher.add('CTG_BLOG', None,
    [{'ORTH':'como'},{'LEMMA':'cuidarme'}],
    [{'ORTH':'como'},{'LEMMA':'poder'},{'LEMMA':'cuidarme'}],
    [{'ORTH':'que'},{'LEMMA':'hacer'}],
    [{'ORTH':'que'},{'LEMMA':'poder'},{'LEMMA':'hacer'}],
    [{'ORTH':'que'},{'LEMMA':'comer'}],
    [{'ORTH':'que'},{'LEMMA':'poder'},{'LEMMA':'comer'}])

matcher.add('AUTOR_BLOG', None,
    [{'POS':'DET'},{'ORTH':'claudia'},{'ORTH':'aguilar'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'claudia'},{'ORTH':'aguilar'}],
    [{'LEMMA':'autor'},{'ORTH':'claudia'},{'ORTH':'aguilar'}],
    [{'POS':'DET'},{'ORTH':'juan'},{'ORTH':'vargas'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'juan'},{'ORTH':'vargas'}],
    [{'LEMMA':'autor'},{'ORTH':'juan'},{'ORTH':'vargas'}],
    [{'POS':'DET'},{'ORTH':'mariana'},{'ORTH':'castillo'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'mariana'},{'ORTH':'castillo'}],
    [{'LEMMA':'autor'},{'ORTH':'mariana'},{'ORTH':'castillo'}],
    [{'POS':'DET'},{'ORTH':'maria'},{'ORTH':'martinez'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'maria'},{'ORTH':'martinez'}],
    [{'LEMMA':'autor'},{'ORTH':'maria'},{'ORTH':'martinez'}],
    [{'POS':'DET'},{'ORTH':'maria'},{'ORTH':'jimenez'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'maria'},{'ORTH':'jimenez'}],
    [{'LEMMA':'autor'},{'ORTH':'maria'},{'ORTH':'jimenez'}],
    [{'POS':'DET'},{'ORTH':'erendira'},{'ORTH':'jimenez'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'erendira'},{'ORTH':'jimenez'}],
    [{'LEMMA':'autor'},{'ORTH':'erendira'},{'ORTH':'jimenez'}],
    [{'POS':'DET'},{'ORTH':'lidia'},{'ORTH':'sanchez'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'lidia'},{'ORTH':'sanchez'}],
    [{'LEMMA':'autor'},{'ORTH':'lidia'},{'ORTH':'sanchez'}],
    [{'POS':'DET'},{'ORTH':'karen'},{'ORTH':'jimenez'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'karen'},{'ORTH':'jimenez'}],
    [{'LEMMA':'autor'},{'ORTH':'karen'},{'ORTH':'jimenez'}],
    [{'POS':'DET'},{'ORTH':'talia'},{'ORTH':'santana'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'talia'},{'ORTH':'santana'}],
    [{'LEMMA':'autor'},{'ORTH':'talia'},{'ORTH':'santana'}],
    [{'POS':'DET'},{'ORTH':'ana'},{'ORTH':'urrutia'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'ana'},{'ORTH':'urrutia'}],
    [{'LEMMA':'autor'},{'ORTH':'ana'},{'ORTH':'urrutia'}],
    [{'POS':'DET'},{'ORTH':'diana'},{'ORTH':'trejo'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'diana'},{'ORTH':'trejo'}],
    [{'LEMMA':'autor'},{'ORTH':'diana'},{'ORTH':'trejo'}],
    [{'POS':'DET'},{'ORTH':'janet'},{'ORTH':'gomez'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'janet'},{'ORTH':'gomez'}],
    [{'LEMMA':'autor'},{'ORTH':'janet'},{'ORTH':'gomez'}],
    [{'POS':'DET'},{'ORTH':'lucia'},{'ORTH':'velazquez'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'lucia'},{'ORTH':'velazquez'}],
    [{'LEMMA':'autor'},{'ORTH':'lucia'},{'ORTH':'velazquez'}],
    [{'POS':'DET'},{'ORTH':'alma'},{'ORTH':'gonzales'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'alma'},{'ORTH':'gonzales'}],
    [{'LEMMA':'autor'},{'ORTH':'alma'},{'ORTH':'gonzales'}],
    [{'POS':'DET'},{'ORTH':'abigail'},{'ORTH':'huerta'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'abigail'},{'ORTH':'huerta'}],
    [{'LEMMA':'autor'},{'ORTH':'abigail'},{'ORTH':'huerta'}],
    [{'POS':'DET'},{'ORTH':'marta'},{'ORTH':'cortez'}],
    [{'LEMMA':'escribir'},{'POS':'ADP'},{'LEMMA':'cuidarme'},{'ORTH':'marta'},{'ORTH':'cortez'}],
    [{'LEMMA':'autor'},{'ORTH':'marta'},{'ORTH':'cortez'}])
    


#Eleccion de Regles

def findRules(texto):
    data = []
    doc = nlp(texto)
    matches = matcher(doc)
    for match_id, start, end in matches:
        string_id = doc.vocab.strings[match_id]  # look up string ID
        span = doc[start:end]
        ind = False
        for op in data:
            if op['tipo'] == string_id:
                ind = True
        
        if ind == False:
            data.append({
                "tipo": string_id,
                "valor": span.text
            })
    return data

def read_in():
  lines = sys.stdin.readlines()
  return json.loads(lines[0])


if __name__ == '__main__':
    lines = read_in()
    texto = lines['texto']
    #texto = 'hoteles'
    data = findRules(texto)
    print(json.dumps(data))