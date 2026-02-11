--
-- PostgreSQL database dump
--

\restrict 75mSfpOBgFCF2h1wvLD3zfEcwnEUXOnPRav13L9Ce3BsQsUpzPTiMlgoC0hVmMb

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: deleted_records; Type: TABLE; Schema: public; Owner: joycecakes
--

CREATE TABLE public.deleted_records (
    id integer NOT NULL,
    table_name character varying(50) NOT NULL,
    record_id character varying(255) NOT NULL,
    machine_id character varying(255),
    deleted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.deleted_records OWNER TO joycecakes;

--
-- Name: deleted_records_id_seq; Type: SEQUENCE; Schema: public; Owner: joycecakes
--

CREATE SEQUENCE public.deleted_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deleted_records_id_seq OWNER TO joycecakes;

--
-- Name: deleted_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: joycecakes
--

ALTER SEQUENCE public.deleted_records_id_seq OWNED BY public.deleted_records.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: joycecakes
--

CREATE TABLE public.order_items (
    id character varying(255) NOT NULL,
    order_id character varying(255) NOT NULL,
    product_id character varying(255) NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_items OWNER TO joycecakes;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: joycecakes
--

CREATE TABLE public.orders (
    id character varying(255) NOT NULL,
    customername character varying(255) NOT NULL,
    total numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'Pendente'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.orders OWNER TO joycecakes;

--
-- Name: products; Type: TABLE; Schema: public; Owner: joycecakes
--

CREATE TABLE public.products (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    category character varying(255),
    imageurlid character varying(255),
    stock_quantity integer DEFAULT 0 NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.products OWNER TO joycecakes;

--
-- Name: reconcile_log; Type: TABLE; Schema: public; Owner: joycecakes
--

CREATE TABLE public.reconcile_log (
    id integer NOT NULL,
    machine_id character varying(255),
    is_consistent boolean NOT NULL,
    mismatches_count integer DEFAULT 0 NOT NULL,
    server_summary jsonb NOT NULL,
    mismatches jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reconcile_log OWNER TO joycecakes;

--
-- Name: reconcile_log_id_seq; Type: SEQUENCE; Schema: public; Owner: joycecakes
--

CREATE SEQUENCE public.reconcile_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reconcile_log_id_seq OWNER TO joycecakes;

--
-- Name: reconcile_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: joycecakes
--

ALTER SEQUENCE public.reconcile_log_id_seq OWNED BY public.reconcile_log.id;


--
-- Name: supplies; Type: TABLE; Schema: public; Owner: joycecakes
--

CREATE TABLE public.supplies (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    unit character varying(10) NOT NULL,
    costperunit numeric(10,2) NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.supplies OWNER TO joycecakes;

--
-- Name: sync_events; Type: TABLE; Schema: public; Owner: joycecakes
--

CREATE TABLE public.sync_events (
    event_id character varying(255) NOT NULL,
    table_name character varying(50) NOT NULL,
    record_id character varying(255),
    machine_id character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sync_events OWNER TO joycecakes;

--
-- Name: sync_log; Type: TABLE; Schema: public; Owner: joycecakes
--

CREATE TABLE public.sync_log (
    id integer NOT NULL,
    table_name character varying(50) NOT NULL,
    record_id character varying(255) NOT NULL,
    action character varying(20) NOT NULL,
    machine_id character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sync_log OWNER TO joycecakes;

--
-- Name: sync_log_id_seq; Type: SEQUENCE; Schema: public; Owner: joycecakes
--

CREATE SEQUENCE public.sync_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_log_id_seq OWNER TO joycecakes;

--
-- Name: sync_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: joycecakes
--

ALTER SEQUENCE public.sync_log_id_seq OWNED BY public.sync_log.id;


--
-- Name: deleted_records id; Type: DEFAULT; Schema: public; Owner: joycecakes
--

ALTER TABLE ONLY public.deleted_records ALTER COLUMN id SET DEFAULT nextval('public.deleted_records_id_seq'::regclass);


--
-- Name: reconcile_log id; Type: DEFAULT; Schema: public; Owner: joycecakes
--

ALTER TABLE ONLY public.reconcile_log ALTER COLUMN id SET DEFAULT nextval('public.reconcile_log_id_seq'::regclass);


--
-- Name: sync_log id; Type: DEFAULT; Schema: public; Owner: joycecakes
--

ALTER TABLE ONLY public.sync_log ALTER COLUMN id SET DEFAULT nextval('public.sync_log_id_seq'::regclass);


--
-- Data for Name: deleted_records; Type: TABLE DATA; Schema: public; Owner: joycecakes
--

COPY public.deleted_records (id, table_name, record_id, machine_id, deleted_at) FROM stdin;
1	products	b75b50bf-d06f-435b-bfde-57523ddc5f9a	machine-B	2026-02-11 11:16:58.288769
2	products	cc83d378-3258-4b63-8ecf-8f589a6db891	reliability-B	2026-02-11 11:27:32.851027
3	products	4cdb4e78-8f72-463c-a715-16d2c1bb70bd	cleanup-script	2026-02-11 13:15:52.239787
4	products	12655da6-2182-4c74-9497-f4cc22a489e0	cleanup-script	2026-02-11 13:15:52.297686
5	products	0206891e-ba77-4e04-b615-6ad2b3e6c735	cleanup-script	2026-02-11 13:15:52.322964
6	products	5e793be6-a271-4b49-8419-cb7f34c4ca10	cleanup-script	2026-02-11 13:15:52.346844
7	products	821d3266-eafc-48c8-8403-193c4bd6f8d0	cleanup-script	2026-02-11 13:15:52.373374
8	products	7310a833-c16e-49eb-805b-d5cd122ca96f	cleanup-script	2026-02-11 13:15:52.397861
9	products	71a2572a-ad14-4a96-9e82-5e3b4b4f1b66	reliability-B	2026-02-11 13:16:24.159759
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: joycecakes
--

COPY public.order_items (id, order_id, product_id, quantity, price, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: joycecakes
--

COPY public.orders (id, customername, total, status, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: joycecakes
--

COPY public.products (id, name, description, price, category, imageurlid, stock_quantity, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: reconcile_log; Type: TABLE DATA; Schema: public; Owner: joycecakes
--

COPY public.reconcile_log (id, machine_id, is_consistent, mismatches_count, server_summary, mismatches, created_at) FROM stdin;
1	machine-uqq8o5h5x	f	1	[{"count": 0, "table": "products", "latestUpdatedAt": null}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 10:39:17.25663
2	machine-uqq8o5h5x	f	1	[{"count": 0, "table": "products", "latestUpdatedAt": null}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 10:40:17.77754
3	machine-uqq8o5h5x	f	1	[{"count": 0, "table": "products", "latestUpdatedAt": null}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 10:41:17.7195
4	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 10:42:16.947757
5	smoke-machine	f	1	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 1, "latestUpdatedAt": "2026-02-11T13:42:44.1236060Z"}, "reason": "latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}]	2026-02-11 10:42:44.276062
6	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 10:43:17.700949
7	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 10:44:18.318426
8	smoke-script	t	0	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[]	2026-02-11 10:45:04.472755
9	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 10:45:50.957269
10	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 10:46:50.79223
11	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 10:47:27.971188
12	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 10:48:17.717772
13	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 110, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 10:59:58.875596
14	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 110, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 11:00:58.721519
15	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 11:01:59.513128
16	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 11:02:58.722764
17	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 11:03:58.720142
18	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 11:04:58.704005
19	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 11:06:21.629361
20	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 11:06:58.720106
21	machine-uqq8o5h5x	f	2	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T13:42:15.087Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 11:08:50.831674
22	machine-uqq8o5h5x	f	2	[{"count": 4, "table": "products", "latestUpdatedAt": "2026-02-11T14:11:40.238Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 4, "table": "products", "latestUpdatedAt": "2026-02-11T14:11:40.238Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 11:11:58.938489
23	machine-uqq8o5h5x	f	2	[{"count": 4, "table": "products", "latestUpdatedAt": "2026-02-11T14:11:40.238Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 4, "table": "products", "latestUpdatedAt": "2026-02-11T14:11:40.238Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 11:12:58.738196
24	machine-uqq8o5h5x	f	2	[{"count": 4, "table": "products", "latestUpdatedAt": "2026-02-11T14:11:40.238Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 4, "table": "products", "latestUpdatedAt": "2026-02-11T14:11:40.238Z"}}, {"table": "supplies", "client": {"count": 169, "latestUpdatedAt": "2026-02-05T17:51:50.901Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 0, "table": "supplies", "latestUpdatedAt": null}}]	2026-02-11 11:14:50.803457
25	smoke-script	f	1	[{"count": 7, "table": "products", "latestUpdatedAt": "2026-02-11T14:27:31.298Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 6, "latestUpdatedAt": "2026-02-11T14:15:46.752Z"}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 7, "table": "products", "latestUpdatedAt": "2026-02-11T14:27:31.298Z"}}]	2026-02-11 11:27:32.526321
26	smoke-script	t	0	[{"count": 6, "table": "products", "latestUpdatedAt": "2026-02-11T14:15:46.752Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[]	2026-02-11 11:29:40.653501
27	smoke-script	f	1	[{"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T16:16:23.926Z"}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[{"table": "products", "client": {"count": 0, "latestUpdatedAt": null}, "reason": "count_and_latest_updatedAt_mismatch", "server": {"count": 1, "table": "products", "latestUpdatedAt": "2026-02-11T16:16:23.926Z"}}]	2026-02-11 13:16:23.966976
28	smoke-script	t	0	[{"count": 0, "table": "products", "latestUpdatedAt": null}, {"count": 0, "table": "orders", "latestUpdatedAt": null}, {"count": 0, "table": "supplies", "latestUpdatedAt": null}, {"count": 0, "table": "order_items", "latestUpdatedAt": null}]	[]	2026-02-11 13:16:58.264233
\.


--
-- Data for Name: supplies; Type: TABLE DATA; Schema: public; Owner: joycecakes
--

COPY public.supplies (id, name, stock, unit, costperunit, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: sync_events; Type: TABLE DATA; Schema: public; Owner: joycecakes
--

COPY public.sync_events (event_id, table_name, record_id, machine_id, created_at) FROM stdin;
6fbd5c4f-8390-4fee-8c68-d64a1c90cb91	products	821d3266-eafc-48c8-8403-193c4bd6f8d0	machine-A	2026-02-11 11:09:13.967137
c70c2300-ff38-402c-bea4-7a44731e1642	products	821d3266-eafc-48c8-8403-193c4bd6f8d0	machine-B	2026-02-11 11:09:14.137906
5633a276-2bec-4a86-897b-e31a073f2d2f	products	5e793be6-a271-4b49-8419-cb7f34c4ca10	machine-A	2026-02-11 11:11:25.145578
5f530d5e-eebe-4e22-a3c3-a851c47cb8f3	products	0206891e-ba77-4e04-b615-6ad2b3e6c735	machine-A	2026-02-11 11:11:40.252568
fb7fd0e3-b2d4-41b7-b79e-c50a2e6fe5f1	products	12655da6-2182-4c74-9497-f4cc22a489e0	machine-A	2026-02-11 11:15:37.46574
ad9f95d0-1b01-408f-9af1-e2c7888f4b89	products	4cdb4e78-8f72-463c-a715-16d2c1bb70bd	machine-A	2026-02-11 11:15:46.761908
f724df9f-0b84-469a-94d5-4aa2c88e6d79	products	b75b50bf-d06f-435b-bfde-57523ddc5f9a	machine-A	2026-02-11 11:16:58.215113
9908f5e9-f27a-4fe9-ba5b-50c7e7ff1728	products	b75b50bf-d06f-435b-bfde-57523ddc5f9a	machine-B	2026-02-11 11:16:58.29604
23d3c22f-b477-4ba2-9480-7357c295f1c7	products	cc83d378-3258-4b63-8ecf-8f589a6db891	reliability-A	2026-02-11 11:27:31.400666
4eeccedd-43c6-49b0-a887-f65fa2fe6aeb	products	cc83d378-3258-4b63-8ecf-8f589a6db891	reliability-A	2026-02-11 11:27:32.742172
c0bf62da-844b-42a7-993d-4b9b5d0b98c1	products	cc83d378-3258-4b63-8ecf-8f589a6db891	reliability-B	2026-02-11 11:27:32.773717
2fa5c045-26ab-4bcd-9bc7-c7da01785936	products	cc83d378-3258-4b63-8ecf-8f589a6db891	reliability-B	2026-02-11 11:27:32.865997
0f5957e3-1362-47a9-a49f-461be766cb81	products	4cdb4e78-8f72-463c-a715-16d2c1bb70bd	cleanup-script	2026-02-11 13:15:52.262288
3e4b2d1a-d0e0-48d6-99c7-cfc63d71b17d	products	12655da6-2182-4c74-9497-f4cc22a489e0	cleanup-script	2026-02-11 13:15:52.305428
443049ab-fb50-4641-8e75-7db21c324ad7	products	0206891e-ba77-4e04-b615-6ad2b3e6c735	cleanup-script	2026-02-11 13:15:52.329012
90469025-dc70-4381-a343-0ed7acf7f227	products	5e793be6-a271-4b49-8419-cb7f34c4ca10	cleanup-script	2026-02-11 13:15:52.354246
b3c35ff8-4eba-49a1-8928-1802728bfe1f	products	821d3266-eafc-48c8-8403-193c4bd6f8d0	cleanup-script	2026-02-11 13:15:52.380581
3e820964-c66c-47eb-a438-23236ad5f047	products	7310a833-c16e-49eb-805b-d5cd122ca96f	cleanup-script	2026-02-11 13:15:52.403598
992246d9-7c68-4773-bd02-89cdd1711309	products	71a2572a-ad14-4a96-9e82-5e3b4b4f1b66	reliability-A	2026-02-11 13:16:23.963266
a72d31e5-e03c-4d99-88a0-2f6023e9dd10	products	71a2572a-ad14-4a96-9e82-5e3b4b4f1b66	reliability-A	2026-02-11 13:16:24.122781
ef5a4df6-568a-4503-95e8-822dc2998672	products	71a2572a-ad14-4a96-9e82-5e3b4b4f1b66	reliability-B	2026-02-11 13:16:24.133384
b1a228e2-3b1c-4c48-9265-fa92a9a879f5	products	71a2572a-ad14-4a96-9e82-5e3b4b4f1b66	reliability-B	2026-02-11 13:16:24.165609
\.


--
-- Data for Name: sync_log; Type: TABLE DATA; Schema: public; Owner: joycecakes
--

COPY public.sync_log (id, table_name, record_id, action, machine_id, created_at) FROM stdin;
1	products	821d3266-eafc-48c8-8403-193c4bd6f8d0	INSERT	machine-A	2026-02-11 11:09:13.961159
2	products	821d3266-eafc-48c8-8403-193c4bd6f8d0	UPDATE	machine-B	2026-02-11 11:09:14.135187
3	products	5e793be6-a271-4b49-8419-cb7f34c4ca10	INSERT	machine-A	2026-02-11 11:11:25.137181
4	products	0206891e-ba77-4e04-b615-6ad2b3e6c735	INSERT	machine-A	2026-02-11 11:11:40.247506
5	products	12655da6-2182-4c74-9497-f4cc22a489e0	INSERT	machine-A	2026-02-11 11:15:37.461596
6	products	4cdb4e78-8f72-463c-a715-16d2c1bb70bd	INSERT	machine-A	2026-02-11 11:15:46.759744
7	products	b75b50bf-d06f-435b-bfde-57523ddc5f9a	INSERT	machine-A	2026-02-11 11:16:58.209169
8	products	b75b50bf-d06f-435b-bfde-57523ddc5f9a	DELETE	machine-B	2026-02-11 11:16:58.294738
9	products	cc83d378-3258-4b63-8ecf-8f589a6db891	INSERT	reliability-A	2026-02-11 11:27:31.384095
10	products	cc83d378-3258-4b63-8ecf-8f589a6db891	UPDATE	reliability-A	2026-02-11 11:27:32.739478
11	products	cc83d378-3258-4b63-8ecf-8f589a6db891	SKIP_STALE	reliability-B	2026-02-11 11:27:32.757647
12	products	cc83d378-3258-4b63-8ecf-8f589a6db891	DELETE	reliability-B	2026-02-11 11:27:32.861862
13	products	4cdb4e78-8f72-463c-a715-16d2c1bb70bd	DELETE	cleanup-script	2026-02-11 13:15:52.257787
14	products	12655da6-2182-4c74-9497-f4cc22a489e0	DELETE	cleanup-script	2026-02-11 13:15:52.302498
15	products	0206891e-ba77-4e04-b615-6ad2b3e6c735	DELETE	cleanup-script	2026-02-11 13:15:52.326049
16	products	5e793be6-a271-4b49-8419-cb7f34c4ca10	DELETE	cleanup-script	2026-02-11 13:15:52.351339
17	products	821d3266-eafc-48c8-8403-193c4bd6f8d0	DELETE	cleanup-script	2026-02-11 13:15:52.377457
18	products	7310a833-c16e-49eb-805b-d5cd122ca96f	DELETE	cleanup-script	2026-02-11 13:15:52.400765
19	products	71a2572a-ad14-4a96-9e82-5e3b4b4f1b66	INSERT	reliability-A	2026-02-11 13:16:23.950795
20	products	71a2572a-ad14-4a96-9e82-5e3b4b4f1b66	UPDATE	reliability-A	2026-02-11 13:16:24.120635
21	products	71a2572a-ad14-4a96-9e82-5e3b4b4f1b66	SKIP_STALE	reliability-B	2026-02-11 13:16:24.132103
22	products	71a2572a-ad14-4a96-9e82-5e3b4b4f1b66	DELETE	reliability-B	2026-02-11 13:16:24.162719
\.


--
-- Name: deleted_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: joycecakes
--

SELECT pg_catalog.setval('public.deleted_records_id_seq', 9, true);


--
-- Name: reconcile_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: joycecakes
--

SELECT pg_catalog.setval('public.reconcile_log_id_seq', 28, true);


--
-- Name: sync_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: joycecakes
--

SELECT pg_catalog.setval('public.sync_log_id_seq', 22, true);


--
-- Name: deleted_records deleted_records_pkey; Type: CONSTRAINT; Schema: public; Owner: joycecakes
--

ALTER TABLE ONLY public.deleted_records
    ADD CONSTRAINT deleted_records_pkey PRIMARY KEY (id);


--
-- Name: deleted_records deleted_records_table_name_record_id_key; Type: CONSTRAINT; Schema: public; Owner: joycecakes
--

ALTER TABLE ONLY public.deleted_records
    ADD CONSTRAINT deleted_records_table_name_record_id_key UNIQUE (table_name, record_id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: joycecakes
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: joycecakes
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: joycecakes
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: reconcile_log reconcile_log_pkey; Type: CONSTRAINT; Schema: public; Owner: joycecakes
--

ALTER TABLE ONLY public.reconcile_log
    ADD CONSTRAINT reconcile_log_pkey PRIMARY KEY (id);


--
-- Name: supplies supplies_pkey; Type: CONSTRAINT; Schema: public; Owner: joycecakes
--

ALTER TABLE ONLY public.supplies
    ADD CONSTRAINT supplies_pkey PRIMARY KEY (id);


--
-- Name: sync_events sync_events_pkey; Type: CONSTRAINT; Schema: public; Owner: joycecakes
--

ALTER TABLE ONLY public.sync_events
    ADD CONSTRAINT sync_events_pkey PRIMARY KEY (event_id);


--
-- Name: sync_log sync_log_pkey; Type: CONSTRAINT; Schema: public; Owner: joycecakes
--

ALTER TABLE ONLY public.sync_log
    ADD CONSTRAINT sync_log_pkey PRIMARY KEY (id);


--
-- Name: idx_deleted_records_table_time; Type: INDEX; Schema: public; Owner: joycecakes
--

CREATE INDEX idx_deleted_records_table_time ON public.deleted_records USING btree (table_name, deleted_at DESC);


--
-- Name: idx_orders_updated; Type: INDEX; Schema: public; Owner: joycecakes
--

CREATE INDEX idx_orders_updated ON public.orders USING btree (updatedat DESC);


--
-- Name: idx_products_updated; Type: INDEX; Schema: public; Owner: joycecakes
--

CREATE INDEX idx_products_updated ON public.products USING btree (updatedat DESC);


--
-- Name: idx_reconcile_log_created; Type: INDEX; Schema: public; Owner: joycecakes
--

CREATE INDEX idx_reconcile_log_created ON public.reconcile_log USING btree (created_at DESC);


--
-- Name: idx_reconcile_log_machine; Type: INDEX; Schema: public; Owner: joycecakes
--

CREATE INDEX idx_reconcile_log_machine ON public.reconcile_log USING btree (machine_id);


--
-- Name: idx_supplies_updated; Type: INDEX; Schema: public; Owner: joycecakes
--

CREATE INDEX idx_supplies_updated ON public.supplies USING btree (updatedat DESC);


--
-- Name: idx_sync_events_table; Type: INDEX; Schema: public; Owner: joycecakes
--

CREATE INDEX idx_sync_events_table ON public.sync_events USING btree (table_name);


--
-- Name: idx_sync_log_table; Type: INDEX; Schema: public; Owner: joycecakes
--

CREATE INDEX idx_sync_log_table ON public.sync_log USING btree (table_name);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: joycecakes
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: joycecakes
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 75mSfpOBgFCF2h1wvLD3zfEcwnEUXOnPRav13L9Ce3BsQsUpzPTiMlgoC0hVmMb

