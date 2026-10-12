import { OrderDetailsPage } from "@/features/orders/pages/OrderDetailsPage";
import { useOrderEditor } from "@/features/orders/hooks/useOrderEditor";
import {
  useCreateOrder,
  useOrder,
  useOrderDocumentDownload,
  useOrderRequirementReport,
  useUpdateOrder,
  useUpdateOrderCustomer,
  useUpdateOrderStatus,
} from "@/features/orders/hooks/useOrderApi";
import type { Order } from "@/features/orders/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/features/orders/hooks/useOrderApi", () => ({
  useOrder: vi.fn(),
  useOrderRequirementReport: vi.fn(),
  useCreateOrder: vi.fn(),
  useUpdateOrder: vi.fn(),
  useUpdateOrderCustomer: vi.fn(),
  useUpdateOrderStatus: vi.fn(),
  useOrderDocumentDownload: vi.fn(),
}));

vi.mock("@/features/orders/hooks/useOrderEditor", () => ({
  useOrderEditor: vi.fn(),
}));

vi.mock("@/features/orders/components/OrderEditorForm", () => ({
  OrderEditorForm: () => <div data-testid="order-editor">Éditeur</div>,
  OrderCustomerEditor: () => (
    <div data-testid="customer-editor">Éditeur client</div>
  ),
}));

vi.mock("@/features/orders/components/OrderItemsDetails", () => ({
  OrderItemsDetails: () => <div>Articles</div>,
}));

vi.mock("@/features/orders/components/OrderRequirementReportCard", () => ({
  OrderRequirementReportCard: () => <div>Besoins</div>,
}));

vi.mock("@/features/orders/components/OrderStatusBadge", () => ({
  OrderStatusBadge: () => <span>Nouvelle</span>,
}));

vi.mock("@/features/orders/components/OrderStatusSelect", () => ({
  OrderStatusSelect: () => <div>Statut</div>,
}));

const order: Order = {
  id: "10000000-0000-4000-8000-000000000001",
  orderNumber: "ADM-00000001",
  source: "ADMIN",
  status: "NEW",
  customerName: "Ada",
  customerPhone: "514",
  customerEmail: null,
  customerAddress: null,
  note: null,
  subtotalCents: 1000,
  discountCents: 0,
  deliveryFeeCents: 0,
  totalCents: 1000,
  externalOrderId: null,
  placedAt: "2026-10-12T12:00:00Z",
  importedAt: "2026-10-12T12:00:00Z",
  acceptedAt: null,
  inPreparationAt: null,
  readyAt: null,
  completedAt: null,
  cancelledAt: null,
  items: [],
};

describe("OrderDetailsPage", () => {
  const update = vi.fn().mockResolvedValue(order);
  const updateCustomer = vi.fn().mockResolvedValue(order);
  const resetFromOrder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    update.mockResolvedValue(order);
    updateCustomer.mockResolvedValue(order);
    vi.mocked(useOrder).mockReturnValue({
      data: order,
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useOrderRequirementReport).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useCreateOrder).mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    } as never);
    vi.mocked(useUpdateOrder).mockReturnValue({
      isPending: false,
      mutateAsync: update,
    } as never);
    vi.mocked(useUpdateOrderCustomer).mockReturnValue({
      isPending: false,
      mutateAsync: updateCustomer,
    } as never);
    vi.mocked(useUpdateOrderStatus).mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    } as never);
    vi.mocked(useOrderDocumentDownload).mockReturnValue({
      isPending: false,
      download: vi.fn(),
    } as never);
    vi.mocked(useOrderEditor).mockReturnValue({
      draft: {
        customerName: "Ada",
        customerPhone: "514",
        customerEmail: "",
        customerAddress: {
          line1: "",
          line2: "",
          city: "",
          province: "",
          postalCode: "",
        },
        note: "",
        discountCents: 0,
        deliveryFeeCents: 0,
        items: [],
      },
      setDraft: vi.fn(),
      products: [],
      searchResults: [],
      productSearch: "",
      setProductSearch: vi.fn(),
      isSearchingProducts: false,
      isProductSearchError: false,
      isLoadingSelectedProducts: false,
      selectedProductsError: false,
      isDirty: false,
      addProduct: vi.fn(),
      patchItem: vi.fn(),
      removeItem: vi.fn(),
      buildRequest: vi.fn().mockReturnValue({ items: [] }),
      resetFromOrder,
      resetNewDraft: vi.fn(),
    } as never);
  });

  it("can enter edit mode again after saving", async () => {
    const router = createMemoryRouter(
      [{ path: "/orders/:orderId", element: <OrderDetailsPage /> }],
      { initialEntries: [`/orders/${order.id}`] },
    );
    render(<RouterProvider router={router} />);

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    expect(screen.getByTestId("order-editor")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Modifier" })).toBeVisible(),
    );

    const secondEditButton = screen.getByRole("button", { name: "Modifier" });
    expect(secondEditButton).toHaveAttribute("type", "button");
    fireEvent.click(secondEditButton);

    expect(screen.getByTestId("order-editor")).toBeInTheDocument();
    expect(update).toHaveBeenCalledOnce();
    expect(resetFromOrder).toHaveBeenCalledWith(order);
  });

  it("edits only customer information on a new web order", async () => {
    const webOrder = {
      ...order,
      orderNumber: "WEB-00000001",
      source: "SAVOURETPLUS_WEB",
      externalOrderId: "20000000-0000-4000-8000-000000000002",
    } satisfies Order;
    vi.mocked(useOrder).mockReturnValue({
      data: webOrder,
      isPending: false,
      isError: false,
    } as never);
    updateCustomer.mockResolvedValue(webOrder);
    const router = createMemoryRouter(
      [{ path: "/orders/:orderId", element: <OrderDetailsPage /> }],
      { initialEntries: [`/orders/${webOrder.id}`] },
    );
    render(<RouterProvider router={router} />);

    expect(
      screen.queryByRole("button", { name: "Modifier" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Modifier le client" }));
    expect(screen.getByTestId("customer-editor")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer le client" }),
    );

    await waitFor(() => expect(updateCustomer).toHaveBeenCalledOnce());
    expect(updateCustomer).toHaveBeenCalledWith({
      orderId: webOrder.id,
      request: {
        customerName: "Ada",
        customerPhone: "514",
        customerEmail: null,
        customerAddress: null,
        note: null,
      },
    });
    expect(update).not.toHaveBeenCalled();
  });
});
