#!/usr/bin/env python3
"""Gera moradores.json (a lista oficial da cidade). Edite a lista M abaixo a cada episódio e rode: python3 build_moradores.py
Campos: handle, nome (como apareceu no comentário, sem sobrenome), raca, trabalho, ep (episódio em que entrou), sprite, work (onde trabalha), casa ("mansao" | "rua" | None=lote numerado)."""
import json, datetime

# sprite por raça (se o arquivo não existir ainda, o site usa dog_caramelo2)
SP = {"pastor alemão": "dog_pastor", "husky": "dog_husky_plain", "pitbull": "dog_pitbull", "pinscher": "dog_pinscher", "rottweiler": "dog_rottweiler",
      "salsicha": "dog_salsicha2", "salsicha de pelo longo": "dog_salsicha_longo", "vira-lata": "dog_caramelo2", "irmão caramelo": "dog_caramelo2",
      "galgo russo": "dog_borzoi", "pastor malinois": "dog_malinois", "pastor alemão com vira-lata": "dog_mix_padeiro",
      "golden": "dog_golden2", "poodle": "dog_poodle2", "pug": "dog_pug2", "shih tzu": "dog_shihtzu", "yorkshire": "dog_yorkshire", "spitz japonês": "dog_spitz",
      "dálmata": "dog_dalmata", "cane corso": "dog_canecorso", "doberman": "dog_doberman", "dogue alemão": "dog_dogue", "kangal": "dog_kangal",
      "boerboel": "dog_boerboel", "mastim inglês": "dog_mastim", "são bernardo": "dog_saobernardo", "greyhound": "dog_greyhound", "galgo inglês": "dog_greyhound",
      "boiadeiro australiano": "dog_boiadeiro", "bull terrier": "dog_bullterrier",
      "cão-lobo": "dog_caolobo", "braco alemão": "dog_braco", "bulldog francês": "dog_bulldogfrances", "bulldog": "dog_bulldog", "buldogue": "dog_bulldog", "border collie": "dog_bordercollie", "spitz alemão": "dog_spitz", "mistura de 5 raças": "dog_pastor", "caramelo": "dog_caramelo2", "caramelo médio": "dog_caramelo2", "salsicha preto e marrom": "dog_salsicha_longo", "salsicha marrom": "dog_salsicha2", "husky siberiano": "dog_husky_plain"}
# onde cada trabalho acontece
def work_of(trabalho):
    t = trabalho.lower()
    for k, w in [("sargent", "delegacia"), ("carcereir", "delegacia"), ("detetive", "delegacia"), ("urna", "palanque"), ("trânsito", "praca"), ("confeit", "padaria"), ("moleir", "padaria"), ("cafeteria", "padaria"), ("pastel", "padaria"), ("borrach", "oficina"), ("assessor", "prefeitura"), ("presidente", "prefeitura"), ("vereador", "prefeitura"), ("contador", "prefeitura"), ("bancári", "padaria"), ("aluno", "escola"), ("pediatra", "praca"), ("cirurg", "praca"), ("bope", "delegacia"), ("polic", "delegacia"), ("comandante", "delegacia"), ("forças", "delegacia"), ("guard", "delegacia"), ("segur", "delegacia"),
                 ("padeir", "padaria"), ("padaria", "padaria"), ("professor", "escola"), ("diretor", "escola"), ("coorden", "escola"),
                 ("mecânic", "oficina"), ("floricult", "floricultura"), ("candidat", "palanque"), ("investidor", "mansao"),
                 ("fiscal", "prefeitura"), ("corretor", "prefeitura"), ("advogad", "prefeitura"), ("médic", "praca"), ("enferm", "praca"), ("veterin", "praca"),
                 ("dentist", "praca"), ("farmác", "praca"), ("bombeir", "praca")]:
        if k in t: return w
    return "praca"

M = [
  # ---- ep. 1 "A fundação" (post DfkGdM9q87-) ----
  ("pequenna_lily", "Lily", "pastor alemão", "candidata a prefeita (petisco de graça)", 1),
  ("diogzin.wx_", "Diogzin", "husky", "candidato a prefeito (neve)", 1),
  ("davigoncalves000", "Davi", "pastor alemão", "candidato a prefeito (ordem)", 1),
  ("ronaldo.rsn", "Ronaldo", "pitbull", "candidato a prefeito (fogo)", 1),
  ("marcosmano_lucas", "Lucas", "irmão caramelo", "candidato a presidente", 1),
  ("biellx_dh77", "Biellx", "rottweiler", "comandante da polícia", 1),
  ("013._miguel_", "Miguel", "são bernardo", "policial", 1),
  ("g.moreira_da_gti", "Guilherme", "pitbull", "médico", 1),
  ("enzo_zz100", "Enzo", "pastor alemão", "capitão do BOPE", 1),
  ("guizinnn_dls", "Gui", "pitbull", "policial do BOPE", 1),
  ("clovisz07_", "Clovis", "pitbull", "dono de um balé", 1),
  ("larissa_rustick", "Larissa", "salsicha", "policial", 1),
  ("lzinn_.x7x_", "Lzinn", "dogue alemão", "policial", 1),
  ("ow.lucass", "Lucass", "doberman", "policial", 1),
  ("ryannzxx__00", "Ryann", "pitbull", "policial", 1),
  ("farquesjose", "José", "rottweiler", "policial", 1),
  ("mzj_01_", "Mzj", "pitbull", "veterinário dos filhotes", 1),
  ("pedrin11056", "Pedrin", "pitbull", "médico", 1),
  ("luiz_eduardorezende", "Luiz Eduardo", "boerboel", "policial", 1),
  ("ytallo____.22", "Ytalo", "pitbull", "pedreiro", 1),
  ("silvaz_.017", "Silvaz", "vira-lata", "policial", 1),
  ("caua0012x", "Cauã", "kangal", "policial das forças especiais", 1),
  ("p_franca2012", "França", "mastim inglês", "guarda da vila", 1),
  ("sousazzcl__", "Davi", "pinscher", "bombeiro", 1),
  ("_caua._7", "Cauã", "greyhound", "bombeiro", 1),
  ("t1t4n_o", "Titan", "pitbull", "bombeiro", 1),
  ("vini_alves_24459d", "Vini", "vira-lata", "bombeiro", 1),
  ("felipinn.xz", "Felipinn", "husky", "padeiro (e candidato: sonho de graça)", 1),
  ("music_addicteddd777", "Music", "pinscher", "padeiro que grita com os clientes", 1),
  ("rafael_tz_0913", "Rafael", "vira-lata", "padaria", 1),
  ("lua.nxxr7", "Lua", "pastor alemão", "diretora da escola", 1),
  ("kamillycaxias", "Kamilly", "galgo inglês", "coordenadora da escola", 1),
  ("arthur_lima_duarte.a", "Arthur", "salsicha", "professor", 1),
  ("blackzin7.ff", "Blackzin", "pitbull", "professor", 1),
  ("rafinha_240466", "Rafinha", "shih tzu", "médico", 1),
  ("giselle.lohanny25", "Giselle", "poodle", "enfermeira chefe", 1),
  ("mariaizabels09", "Maria Izabel", "yorkshire", "veterinária", 1),
  ("bernardoartess", "Bernardo", "salsicha", "dentista", 1),
  ("deceased.moths", "Moths", "spitz japonês", "farmácia natural", 1),
  ("gust7_gh", "Gust", "vira-lata", "entregador de pizza", 1),
  ("max_silvazx7", "Max", "pitbull", "treinador", 1),
  ("josexyt._", "José", "cane corso", "mecânico", 1),
  ("luan_.peixoto", "Luan", "pastor malinois", "mecânico", 1),
  ("caike.freitas22", "Caike", "boiadeiro australiano", "fazendeiro", 1),
  ("caduuu_ig", "Cadu", "dálmata", "dono do playground", 1),
  ("jacson_eletrotec", "Jacson", "pinscher", "vizinho fofoqueiro", 1),
  ("danielmottaj", "Daniel", "pinscher", "corretor", 1),
  ("luizzbx7", "Luiz", "pug", "advogado", 1),
  ("bazar_mv2023_gv", "Bazar", "vira-lata", "jogador de futebol", 1),
  ("qvc_davizinho244", "Davizinho", "pinscher", "ainda escolhendo o trabalho", 1),
  ("racadodia", "Speed", "salsicha de pelo longo", "investidor e empresário", 1),
  # ---- ep. 2 "A eleição" (reel Dfk8H-NK3Sn) ----
  ("big.hero72", "Hero", "vira-lata", "eleitor (votou na Lily)", 2),
  ("isaques124", "Isaque", "pug", "professor de matemática", 2),
  ("johrancruyf", "Johran", "pitbull", "policial", 2),
  ("marqueesssxx_", "Giovanna", "galgo russo", "dona da floricultura", 2),
  ("medeirosvalentinatavares", "Hanna", "bull terrier", "médica e cuidadora de animais", 2),
  ("rafaelswaizergalle", "Rafael", "salsicha", "professor", 2),
  ("usuario80806", "Usuário", "vira-lata", "fiscal da prefeitura (confere se todo mundo aparece)", 2),
  # ---- ep. 3 "O mais rico da cidade" (reel DfmXMleK4Jw) ----
  ("ww.rlsilvax__v11", "Wenderson", "pastor alemão com vira-lata", "padeiro", 3),
  # ---- entraram pelo site em 11/11/2026 (comentaram, ainda sem aparecer em vídeo) ----
  ("helena.luisaof", "Helena", "cão-lobo", "sargenta da polícia", 1, False),
  ("gabiszzz_ff", "Gabi", "pastor alemão", "taxista (numa cidade sem carro)", 1, False),
  ("tigershark1215", "Tiger", "pitbull", "confeiteiro", 1, False),
  ("araujozx_2014", "Araújo", "rottweiler", "carcereiro (dono da jaula)", 1, False),
  ("rafaxv33xvulgo", "Rafa", "husky", "moleiro (faz a farinha)", 1, False),
  ("berbbaggio", "Berb", "mistura de 5 raças", "vigia noturno", 1, False),
  ("marinho_do_balacubacu_77", "Marinho", "pug", "dono da cafeteria", 1, False),
  ("ryanff233", "Ryan", "caramelo", "frentista (sem posto, sem carro)", 1, False),
  ("vitinho_bradoo", "Vitinho", "vira-lata", "guarda de trânsito", 1, False),
  ("amigus.embolados", "Amigus", "braco alemão", "artesã", 1, False),
  ("silvaflaviafaria", "Flávia", "pastor alemão", "pasteleira", 1, False),
  ("bernardo_riberio", "Bernardo R.", "salsicha preto e marrom", "sentinela do carteiro", 1, False),
  ("murillosilvatimoteo", "Murillo", "husky", "cirurgião", 1, False),
  ("charizard_storee", "Charizard", "bulldog francês", "dono da loja de petiscos", 1, False),
  ("bn.oliveira2012", "Bruno", "vira-lata", "caminhoneiro", 1, False),
  ("barbosanycollasrodrigues", "Nycollas", "bulldog", "porteiro do muro", 1, False),
  ("nathankapuscinski08", "Nathan", "pastor alemão", "guarda-florestal", 1, False),
  ("j0a0z_0z", "João", "pastor alemão", "detetive", 2, False),
  ("mattwz_88", "Matt", "vira-lata", "assessor do prefeito", 2, False),
  ("honra_eterna", "Honra", "vira-lata", "guarda da urna", 2, False),
  ("icaromello__", "Ícaro", "caramelo médio", "borracheiro", 2, False),
  ("viniciusalmeida4680", "Vinicius", "vira-lata", "presidente da associação de moradores", 2, False),
  ("guiih_carvalho26", "Guih", "pug", "bancário (o banco é o buraco atrás da padaria)", 2, False),
  ("rh_quentao777", "RH", "border collie", "pecuarista", 2, False),
  ("davi43164344", "Davi (o terceiro)", "vira-lata", "presidente da câmara de vereadores", 2, False),
  ("lucastoledo_1108", "Lucas T.", "caramelo", "aluno (o primeiro da escola)", 2, False),
  ("brayan_tbk", "Brayan", "salsicha marrom", "vereador", 2, False),
  ("sperber.cecilia", "Cecília", "spitz alemão", "pediatra dos filhotes", 3, False),
  ("fabzz.2014", "Fabzz", "buldogue", "técnico de celular", 3, False),
  ("raphael._.sense", "Raphael", "border collie", "contador", 3, False),
  ("matheusjosealmeidadasilva", "Matheus", "husky siberiano", "capitão do time de futebol", 3, False),
]
CASA = {"racadodia": "mansao", "enzo_zz100": "rua"}
EPS = {1: "https://www.instagram.com/caramelopolis.br/reel/DfkGdM9q87-/", 2: "https://www.instagram.com/caramelopolis.br/reel/Dfk8H-NK3Sn/", 3: "https://www.instagram.com/caramelopolis.br/reel/DfmXMleK4Jw/"}
URNA = {"aberta": True, "fecha": "no ep. 4", "parcial": [["LILY", 3], ["DAVI", 2], ["DIOGZIN", 0], ["RONALDO", 0], ["LUCAS", 0]]}  # votos contados em 11/11 09:30

lote = 0; out = []
for row in M:
    h, nome, raca, trab, ep = row[:5]; video = row[5] if len(row) > 5 else True
    casa = CASA.get(h)
    if casa is None: casa = lote; lote += 1
    out.append({"id": h, "nome": nome, "raca": raca, "trabalho": trab, "ep": ep, "sprite": SP.get(raca, "dog_caramelo2"), "work": work_of(trab), "casa": casa, "video": video})
data = {"atualizado": datetime.date.today().isoformat(), "episodio_atual": 3, "episodios": EPS, "urna": URNA, "moradores": out}
json.dump(data, open("moradores.json", "w"), ensure_ascii=False, indent=1)
print(len(out), "moradores,", lote, "lotes")
