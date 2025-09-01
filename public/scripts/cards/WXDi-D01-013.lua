-- public/scripts/cards/WXDi-D01-013.lua

-- Tên table phải khớp với ID của lá bài, thay '-' bằng '_'
WXDi_D01_013 = {}

-- Tên hàm phải khớp với quy ước
function WXDi_D01_013.OnEnterField()
  -- Ghi log để debug
  Game.log("Sen no Rikyu's [Enter] ability activated!")
  
  -- Gọi API để thực hiện hiệu ứng
  Game.enerCharge(3)
end
