#These functions are for helping create the alignment file for the annotation tool
#The main function to utilize is the create_data function

def sections_to_list(sections):
    ret = []
    headings = []
    for section in sections:
        ret.append([section["heading"]])
        headings.append([section["heading"]])
        ret.append(section["text"])
    return ret, headings

def create_transformer(sections):
    count = 0
    t_list = []
    s_list, _ = sections_to_list(sections)
    for i in range(len(s_list)):
        for j in range(len(s_list[i])):
            t_list.append((i, j))
    return t_list
        

def plen(transformer, p):
    c = 0
    for para, sent in transformer:
        if para == p:
            c += 1
    return c

def create_pt(plist, transformer):
    pt = []
    pt2 = []
    for p in plist:
        length = plen(transformer, p)
        pt.extend(range(length))
        pt2.extend([p]*length)
    return pt, pt2


def create_alignment_tuple(alist, com_transformer, sim_transformer):
    fin_list = []
    if alist["paragraph_alignments"] == "none":
        ca_list = alist["sentence_alignment_list"][0]
        for pairs in ca_list:
            if len(pairs) < 2:
                break
            for idx in pairs[0]:
                for idx2 in pairs[1]:
                    fin_list.append((idx, idx2))
    else:
        for i in range(len(alist["paragraph_alignments"])):
            p_a = alist["paragraph_alignments"][i]
            psa = alist["sentence_alignment_list"][i]
            p1_pt, p1_pt2 = create_pt(p_a[0], com_transformer)
            p2_pt, p2_pt2 = create_pt(p_a[1], sim_transformer)
            for j in range(len(psa)):
                pairs = psa[j]
                if len(pairs) < 2:
                    continue
                for idx in pairs[0]:
                    for idx2 in pairs[1]:
                        new_idx = com_transformer.index((p1_pt2[idx], p1_pt[idx]))
                        new_idx2 = sim_transformer.index((p2_pt2[idx2], p2_pt[idx2]))
                        fin_list.append((new_idx, new_idx2))
    return fin_list

def has_multiple_pairs(fin_list, idx):
    i = 0
    for pair in fin_list:
        if pair[0] == idx:
            i += 1
        if i > 1:
            return True
    return False

def aggregate_sections(sections):
    ret = []
    for section in sections:
        ret.append(section["heading"])
        ret.extend(section["text"])
    return ret


#create_data: creates all the content needed in the alignment file as a string

#parameters:
#data_dict: a list of dictionaries that contains the complex and simple document pairs. See sample_json_file.json
#for an example (mass_alignments field not required)
#func_list: a list of similarity functions to use for the alignment file. Functions can only carry two
#parameters for the two sentences to compare
#dict_aligned (optional): if mass_alignments is a field (could be changed), allow these pre-recorded alignments to be
#accounted for.
#article_names (optional): has to be the same length as the data_dict if used. Stores names for articles in
#json file.

def create_data(data_dict, func_list, func_name_list, dict_aligned=False, article_names=None):
    article_num = 0
    data = "pair_ID|pair_UID|sent_0_idx|sent_0|sent_1_idx|sent_1|aligning_method|ins|del|sub|ela"

    for name in func_name_list:
        data += "|" + name 
    data += "\n"

    for doc in data_dict:
        if article_names is None:
            article_id = "article" + str(article_num)
        else:
            article_id = article_names[article_num]
        i = 0
        simple = []
        sim_transformer = []
        if type(doc["simple"][0]) == dict:
            simple = aggregate_sections(doc["simple"])
            sim_transformer = create_transformer(doc["simple"])
        else:
            simple = doc["simple"]
        comp = []
        com_transformer = []
        if type(doc["complex"][0]) == dict:
            comp = aggregate_sections(doc["complex"])
            com_transformer = create_transformer(doc["complex"])
        else:
            comp = doc["complex"]
        if "mass_alignments" in doc.keys() and dict_aligned:
            fin_list = create_alignment_tuple(doc["mass_alignments"], com_transformer, sim_transformer)
        for com_sent in comp:
            com_id = ""
            if len(com_transformer) == 0:
                com_id = "-1-0-" + str(i)
            else:
                com_id = "-1-" + str(com_transformer[i][0]) + "-" + str(com_transformer[i][1])
                j = 0
            for sim_sent in simple:
                sim_id = ""
                if len(sim_transformer) == 0:
                    sim_id = "-0-0-" + str(j)
                else:
                    sim_id = "-0-"+ str(sim_transformer[j][0]) + "-" + str(sim_transformer[j][1])
                sent_0_id = article_id + com_id
                sent_1_id = article_id + sim_id
                pair_id = "ID-" + article_id + com_id + sim_id
                annotation = 3
                if "mass_alignments" in doc.keys() and dict_aligned:
                    if (i, j) in fin_list:
                        if has_multiple_pairs(fin_list, i):
                            annotation = 2
                        else:
                            annotation = 1
                com_sent = com_sent.replace("\n", " ")
                sim_sent = sim_sent.replace("\n", " ")
                entry = pair_id + "|UID|" + sent_0_id + "|" + com_sent + "|" + sent_1_id + "|" + sim_sent + "|" + str(annotation) + "|" + str(0) + "|" + str(0) + "|" + str(0) + "|" + str(0) 
                for func in func_list:
                    entry += "|" + str(func(com_sent, sim_sent))
                entry += "\n"
                data += entry
                j += 1
            i += 1
        article_num += 1
    return data



            
