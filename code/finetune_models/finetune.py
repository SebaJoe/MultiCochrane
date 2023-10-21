import pandas as pd
from simpletransformers.t5 import T5Model, T5Args
import argparse

    
def train_model(
    model_type,
    model_name,
    train_data,
    eval_data,
    seq_length=256,
    batch_size=8,
    acc_steps=4,
    epochs=1,
    do_sample=True,
    top_k=None,
    top_p=0.95,
    num_beams=1,
    seed=45
):
    model_args = T5Args()
    model_args.max_seq_length = seq_length
    model_args.max_length = 512
    model_args.train_batch_size = batch_size
    model_args.gradient_accumulation_steps = acc_steps
    model_args.gradient_checkpointing = True
    model_args.eval_batch_size = batch_size
    model_args.num_train_epochs = epochs
    model_args.evaluate_during_training = True
    model_args.evaluate_during_training_steps = 300
    model_args.use_multiprocessing = False
    model_args.fp16 = False
    model_args.save_steps = -1
    model_args.save_eval_checkpoints = False
    model_args.no_cache = True
    model_args.reprocess_input_data = True
    model_args.overwrite_output_dir = True
    model_args.preprocess_inputs = True
    model_args.optimizer = "AdamW"
    model_args.num_return_sequences = 1
    model_args.lazy_loading = False
    model_args.no_save = True
    model_args.do_sample = do_sample
    model_args.top_k = top_k
    model_args.top_p = top_p
    model_args.num_beams = num_beams
    model_args.save_model_every_epoch = False
    model_args.manual_seed = seed 
    model = T5Model(model_type, model_name, args=model_args)
    model.train_model(train_data, eval_data=eval_data)
    return model    
    


def save_model(model, save_name):
    model.save_pretrained(save_name)


def training_loop(args):
    
    training_data = pd.read_csv(args.train_file)
    validation_data = pd.read_csv(args.val_file)

    do_sample = True if args.do_sample is None else args.do_sample == "True"
    top_p = None if not do_sample else 0.95

    if args.top_p is not None:
        top_p = args.top_p
        

    model_name = 'google/mt5-base' if args.model_name is None else args.model_name
    model_type = 'mt5' if args.model_type is None else args.model_type
    
    model = train_model(model_type, model_name,
                        training_data,
                        validation_data,
                        do_sample=do_sample,
                        top_p=top_p,
                        epochs=5
    )

    if args.save_name is not None:
        save_model(model.model, args.save_name)
    

    
def main():
    
    argParser = argparse.ArgumentParser()
    argParser.add_argument('--train_file', help='File containing training data')
    argParser.add_argument('--val_file', help='File containing validation data')
    argParser.add_argument('--do_sample', help='do sampling')
    argParser.add_argument('--top_p', help="set top_p if sampling")
    argParser.add_argument("--save_name", help="save final state of the model under filename")
    argParser.add_argument("--model_name", help="set the model name. Default mt5-base")
    argParser.add_argument("--model_type", help='type of the model')       
    args = argParser.parse_args()

    if args.train_file is not None:
        training_loop(args)
        
if __name__ == "__main__":
    main()
