-- public/scripts/cards/test-card.lua
-- Đây là script cho một lá bài thử nghiệm

-- Định nghĩa một table để chứa logic của lá bài
TestCard = {}

-- Hàm này sẽ được gọi khi lá bài vào sân
function TestCard.OnEnterField()
  print("[Lua] TestCard.OnEnterField called!")
  
  -- Gọi API từ TypeScript để tương tác với game
  local currentTurn = Game.getTurn()
  print("[Lua] Current turn from TS is: " .. currentTurn)
  
  print("[Lua] Calling Game.increaseTurn()...")
  Game.increaseTurn()
  
  local newTurn = Game.getTurn()
  print("[Lua] New turn from TS is: " .. newTurn)
end

-- Hàm này có thể được gọi khi người chơi kích hoạt (Action)
function TestCard.OnActivate()
  print("[Lua] TestCard.OnActivate called!")
end
