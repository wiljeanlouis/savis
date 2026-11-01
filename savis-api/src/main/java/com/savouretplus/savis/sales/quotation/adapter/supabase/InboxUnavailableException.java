package com.savouretplus.savis.sales.quotation.adapter.supabase;

public class InboxUnavailableException extends RuntimeException {
    public InboxUnavailableException() { super("La réception Supabase est indisponible"); }
}
