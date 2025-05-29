-- Function to reset auto-increment sequences
CREATE OR REPLACE FUNCTION reset_menu_items_sequence()
RETURNS void AS $$
BEGIN
  -- Reset menu_items sequence
  PERFORM setval(pg_get_serial_sequence('menu_items', 'id'), 1, false);

  -- Reset orders sequence
  PERFORM setval(pg_get_serial_sequence('orders', 'id'), 1, false);

  -- Reset daily_menus sequence
  PERFORM setval(pg_get_serial_sequence('daily_menus', 'id'), 1, false);

  -- Reset users sequence
  PERFORM setval(pg_get_serial_sequence('users', 'id'), 1, false);
END;
$$ LANGUAGE plpgsql;