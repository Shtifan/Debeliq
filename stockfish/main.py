from stockfish import Stockfish


def get_fen(image_path):
    return fen


def get_best_move(stockfish, fen):
    stockfish.set_fen_position(fen)
    best_move = stockfish.get_best_move()
    return best_move


image_path = "./stockfish/board.png"
fen = get_fen(image_path)

stockfish = Stockfish("C:/Stockfish/stockfish.exe")

try:
    best_move_white = get_best_move(stockfish, fen + " w - - 0 1")
    best_move_black = get_best_move(stockfish, fen + " b - - 0 1")

    with open("./stockfish/best_moves.txt", "w") as file:
        file.write(f"{best_move_white}\n")
        file.write(f"{best_move_black}\n")

except Exception as e:
    with open("./stockfish/best_moves.txt", "w") as file:
        pass
