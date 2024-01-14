from stockfish import Stockfish
from board_to_fen.predict import get_fen_from_image_path

def get_best_move(stockfish, fen):
    stockfish.set_fen_position(fen)
    best_move = stockfish.get_best_move()
    return best_move

def rotate_fen(fen):
    fen_parts = fen.split('/')
    reversed_fen_parts = [part[::-1] for part in fen_parts[::-1]]
    rotated_fen = '/'.join(reversed_fen_parts)
    return rotated_fen

image_path = "./python/image.png"
stockfish = Stockfish("C:/Stockfish/stockfish.exe")

fen = get_fen_from_image_path(image_path)

try:
    best_move_white = get_best_move(stockfish, fen + " w - - 0 1")
    print(best_move_white)

    fen = rotate_fen(fen)
    
    best_move_black = get_best_move(stockfish, fen + " b - - 0 1")
    print(best_move_black)
except Exception as e:
    pass
