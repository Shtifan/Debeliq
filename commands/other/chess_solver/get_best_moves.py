import sys
import chess
import chess.engine
from config import STOCKFISH_PATH

def get_best_moves(fen):
    try:
        engine = chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)
        
        # Get best move for White
        board = chess.Board(fen)
        if board.turn != chess.WHITE:
            board.turn = chess.WHITE
        result = engine.play(board, chess.engine.Limit(time=2.0))
        white_move = result.move.uci()
        
        # Get best move for Black
        black_board = chess.Board(fen)
        black_board.turn = chess.BLACK
        result = engine.play(black_board, chess.engine.Limit(time=2.0))
        black_move = result.move.uci()
        
        engine.quit()
        
        print(f"WHITE_MOVE:{white_move}")
        print(f"BLACK_MOVE:{black_move}")
        return True
    except Exception as e:
        print(f"ERROR:{str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("ERROR:Please provide a FEN string as an argument")
        sys.exit(1)
    
    fen = sys.argv[1]
    success = get_best_moves(fen)
    sys.exit(0 if success else 1)
