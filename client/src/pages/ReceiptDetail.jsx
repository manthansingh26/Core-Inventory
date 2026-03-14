import { useParams } from 'react-router-dom';
import StockMoveDetail from '../components/StockMoveDetail';
export default function ReceiptDetail() {
  const { id } = useParams();
  return <StockMoveDetail id={id} type="receipt" />;
}
