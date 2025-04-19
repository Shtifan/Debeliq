import os
import sys
import subprocess
from config import IMAGE_PATH, STOCKFISH_PATH, INVERT_COLORS, OUTPUT_PATH

print("[1/3] Extracting FEN from image...")
fen = None
try:
    from image_to_fen import ChessboardPredictor
    import load_image

    img = load_image.load_image(IMAGE_PATH)
    if img is None:
        print(f"Couldn't load image: {IMAGE_PATH}")
        sys.exit(1)
    predictor = ChessboardPredictor()
    tiles, corners = None, None
    import chessboard_finder

    tiles, corners = chessboard_finder.findGrayscaleTilesInImage(img)
    if tiles is None:
        print("Couldn't find chessboard in image")
        sys.exit(1)
    fen, tile_certainties = predictor.get_prediction(tiles)
    predictor.close()
    
    # Handle color inversion if requested
    if INVERT_COLORS:
        print("Inverting board colors (black on bottom)")
        # Invert the FEN string representation
        parts = fen.split(' ')
        boardPart = parts[0]
        
        # Split the board part by ranks
        ranks = boardPart.split('/')
        invertedRanks = []
        for rank in ranks:
            invRank = ''
            # Process each character but DON'T reverse the rank
            for char in rank:
                if char.isdigit():
                    invRank += char
                elif char.isupper():
                    invRank += char.lower()
                else:
                    invRank += char.upper()
            invertedRanks.append(invRank)
        
        # Reverse the order of ranks (flip board vertically) and join them
        invertedBoardPart = '/'.join(invertedRanks[::-1])
        
        # Handle turn (w/b) inversion
        otherParts = parts[1:]
        if len(otherParts) > 0:
            if otherParts[0] == 'w':
                otherParts[0] = 'b'
            elif otherParts[0] == 'b':
                otherParts[0] = 'w'
        
        # Put the FEN back together
        fen = invertedBoardPart + ' ' + ' '.join(otherParts)
    
    print(f"Predicted FEN: {fen}")
except Exception as e:
    print(f"Error extracting FEN: {e}")
    sys.exit(1)

print("[2/3] Getting best moves from FEN via Stockfish...")
white_move = None
black_move = None
try:
    from fen_to_best_move import fen_to_best_moves

    white_move, black_move = fen_to_best_moves(fen)
    print(f"Best move for White: {white_move}")
    print(f"Best move for Black: {black_move}")
except Exception as e:
    print(f"Error getting best moves: {e}")
    sys.exit(1)

print("[3/3] Drawing best moves on board...")
try:
    from draw_best_move import draw_best_move

    output_path = draw_best_move(IMAGE_PATH, white_move, black_move, invert=INVERT_COLORS)
    print(f"Saved: {output_path}")
except Exception as e:
    print(f"Error drawing best moves: {e}")
    sys.exit(1)
