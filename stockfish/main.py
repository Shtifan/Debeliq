from stockfish import Stockfish

# def get_fen(image):


def get_best_move(stockfish, fen):
    stockfish.set_fen_position(fen)
    best_move = stockfish.get_best_move()
    return best_move


def main():
    # fen=get_fen('./stockfish/board.png')
    fen = "r5k1/1bq1br2/ppn2n1Q/2ppp3/P2P4/2P2NN1/1P2BPPP/R4RK1"

    stockfish = Stockfish("./stockfish/stockfish.exe")

    try:
        best_move_white = get_best_move(stockfish, fen + " w - - 0 1")
        best_move_black = get_best_move(stockfish, fen + " b - - 0 1")

        with open("./stockfish/best_moves.txt", "w") as file:
            file.write(f"{best_move_white}\n")
            file.write(f"{best_move_black}\n")

    except Exception as e:
        with open("./stockfish/best_moves.txt", "w") as file:
            pass


if __name__ == "__main__":
    main()
