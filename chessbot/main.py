from stockfish import Stockfish
from board_to_fen.predict import get_fen_from_image_path

def get_best_move(stockfish, fen):
    stockfish.set_fen_position(fen)
    best_move = stockfish.get_best_move()
    return best_move

image_path = "./chessbot/image.png"
stockfish = Stockfish("C:/Stockfish/stockfish.exe")

fen = get_fen_from_image_path(image_path)
print(fen)

best_move_white = get_best_move(stockfish, fen + " w - - 0 1")
best_move_black = get_best_move(stockfish, fen + " b - - 0 1")

with open("./chessbot/result.txt", "w") as file:
    file.write(f"{best_move_white}\n")
    file.write(f"{best_move_black}\n")
