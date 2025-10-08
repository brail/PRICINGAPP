import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Parameters from '../Parameters';
import { pricingApi } from '../../services/api';

// Mock del pricingApi
jest.mock('../../services/api');

// Wrapper per Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserWrapper>
);

describe('Parameters Component', () => {
  const mockParameterSets = [
    {
      id: 1,
      description: 'Default Parameters',
      duty: 8,
      optimalMargin: 49,
      purchaseCurrency: 'USD',
      sellingCurrency: 'EUR',
      isDefault: true
    },
    {
      id: 2,
      description: 'Custom Parameters',
      duty: 12,
      optimalMargin: 55,
      purchaseCurrency: 'EUR',
      sellingCurrency: 'USD',
      isDefault: false
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (pricingApi.getParameterSets as jest.Mock).mockResolvedValue(mockParameterSets);
  });

  it('renders parameters list correctly', async () => {
    render(
      <RouterWrapper>
        <Parameters />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Default Parameters')).toBeInTheDocument();
      expect(screen.getByText('Custom Parameters')).toBeInTheDocument();
    });
  });

  it('displays parameter details when expanded', async () => {
    render(
      <RouterWrapper>
        <Parameters />
      </RouterWrapper>
    );

    await waitFor(() => {
      const expandButton = screen.getByText('Default Parameters');
      fireEvent.click(expandButton);
    });

    expect(screen.getByText('8%')).toBeInTheDocument();
    expect(screen.getByText('49%')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
  });

  it('loads parameter set when load button is clicked', async () => {
    const user = userEvent.setup();
    (pricingApi.loadParameterSet as jest.Mock).mockResolvedValue({});

    render(
      <RouterWrapper>
        <Parameters />
      </RouterWrapper>
    );

    await waitFor(() => {
      const expandButton = screen.getByText('Default Parameters');
      fireEvent.click(expandButton);
    });

    const loadButton = screen.getByText('Carica');
    await user.click(loadButton);

    await waitFor(() => {
      expect(pricingApi.loadParameterSet).toHaveBeenCalledWith(1);
    });
  });

  it('sets parameter set as default', async () => {
    const user = userEvent.setup();
    (pricingApi.setDefaultParameterSet as jest.Mock).mockResolvedValue({});

    render(
      <RouterWrapper>
        <Parameters />
      </RouterWrapper>
    );

    await waitFor(() => {
      const expandButton = screen.getByText('Custom Parameters');
      fireEvent.click(expandButton);
    });

    const setDefaultButton = screen.getByText('Imposta come Default');
    await user.click(setDefaultButton);

    await waitFor(() => {
      expect(pricingApi.setDefaultParameterSet).toHaveBeenCalledWith(2);
    });
  });

  it('shows loading state during operations', async () => {
    (pricingApi.loadParameterSet as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <RouterWrapper>
        <Parameters />
      </RouterWrapper>
    );

    await waitFor(() => {
      const expandButton = screen.getByText('Default Parameters');
      fireEvent.click(expandButton);
    });

    const loadButton = screen.getByText('Carica');
    fireEvent.click(loadButton);

    expect(screen.getByText(/Caricamento parametri/i)).toBeInTheDocument();
  });

  it('handles errors gracefully', async () => {
    const user = userEvent.setup();
    (pricingApi.loadParameterSet as jest.Mock).mockRejectedValue(new Error('Load failed'));

    render(
      <RouterWrapper>
        <Parameters />
      </RouterWrapper>
    );

    await waitFor(() => {
      const expandButton = screen.getByText('Default Parameters');
      fireEvent.click(expandButton);
    });

    const loadButton = screen.getByText('Carica');
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText(/Errore nel caricamento del set di parametri/i)).toBeInTheDocument();
    });
  });
});
