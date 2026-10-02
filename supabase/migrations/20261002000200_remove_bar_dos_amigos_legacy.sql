-- Remove legacy IMORTAL0800 / BarCoin / BarAI / Store modules.
-- These tables were verified empty and are not referenced by active IMORTAL0800 functions.

DROP TABLE IF EXISTS public.barai_feedback;
DROP TABLE IF EXISTS public.barai_messages;
DROP TABLE IF EXISTS public.barai_memory;
DROP TABLE IF EXISTS public.barai_sessions;

DROP TABLE IF EXISTS public.barcoin_transactions;
DROP TABLE IF EXISTS public.barcoin_wallets;
DROP TABLE IF EXISTS public.barcoin_rules;

DROP TABLE IF EXISTS public.logs_barcoins;
DROP TABLE IF EXISTS public.ranking_barcoins;
DROP TABLE IF EXISTS public.campeoes_barcoins;
DROP TABLE IF EXISTS public.usuarios_barcoins;

DROP TABLE IF EXISTS public.store_order_items;
DROP TABLE IF EXISTS public.store_redemptions;
DROP TABLE IF EXISTS public.store_orders;
DROP TABLE IF EXISTS public.store_products;
